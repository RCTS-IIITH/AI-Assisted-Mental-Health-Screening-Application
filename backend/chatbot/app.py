from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace
from rag_chain import get_chain
import json
import asyncio
import logging
from database import connect_db, insert_dataset, get_questionair, list_questionairs, get_chat
import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables first
load_dotenv()

app = FastAPI()

# Global database connection
db = None

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "*"), "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Available models configuration
MODELS = {
    "Mistral": ChatHuggingFace( llm = HuggingFaceEndpoint(
        repo_id="mistralai/Mistral-7b-instruct-v0.3",
        task='conversational',
        max_new_tokens=128,
        temperature=0.7,
        huggingfacehub_api_token=os.getenv("HF_TOKEN")
        )
    ),
    "Zephyr": HuggingFaceEndpoint(
        repo_id="HuggingFaceH4/zephyr-7b-beta",
        task="text-generation",
        max_new_tokens=128,
        temperature=0.7,
        huggingfacehub_api_token=os.getenv("HF_TOKEN")
    ),
    "Sarvam": ChatHuggingFace( llm = HuggingFaceEndpoint(
        repo_id="sarvamai/sarvam-m",
        task="text2text-generation",
        max_new_tokens=128,
        temperature=0.7,
        huggingfacehub_api_token=os.getenv("HF_TOKEN")
        )
    )
}

# Request/Response models for regular chat
class ChatRequest(BaseModel):
    session_id: str
    question: str
    model: str = "Mistral"
    age: int = 15

class ChatResponse(BaseModel):
    answer: str
    model_used: str
    options : list = []

# Request/Response models for questionnaire chatbot
class QuestionnaireStartRequest(BaseModel):
    student_name: str
    student_dob: str
    student_gender: str
    parent_name: Optional[str] = None
    teacher_name: Optional[str] = None
    questionnaire_name: str
    session_id: Optional[str] = None
    tnc_accepted: bool = False

class QuestionnaireAnswerRequest(BaseModel):
    session_id: str
    answer: str
    answer_index: Optional[int] = None

class QuestionnaireResponse(BaseModel):
    session_id: str
    question: str
    options: List[str]
    question_number: int
    total_questions: int
    is_complete: bool = False
    follow_up_triggered: bool = False
    results: Optional[Dict[str, Any]] = None

class QuestionnaireSession:
    def __init__(self, questionnaire_data: Dict, session_id: str):
        self.session_id = session_id
        self.questionnaire_data = questionnaire_data
        self.current_question_index = 0
        self.in_follow_up = False
        self.current_follow_up_index = 0
        self.is_complete = False
        
    def get_current_question(self):
        if self.in_follow_up:
            main_question = self.questionnaire_data["questions"][self.current_question_index]
            if "follow_ups" in main_question and self.current_follow_up_index < len(main_question["follow_ups"]):
                return main_question["follow_ups"][self.current_follow_up_index]
            else:
                self.in_follow_up = False
                self.current_follow_up_index = 0
                self.current_question_index += 1
                return self.get_current_question()
        else:
            if self.current_question_index < len(self.questionnaire_data["questions"]):
                return self.questionnaire_data["questions"][self.current_question_index]
            else:
                self.is_complete = True
                return None
    
    def answer_question(self, answer: str, answer_index: Optional[int] = None, data: Dict = None):
        current_q = self.get_current_question()
        if not current_q:
            return False, data
            
        answer_data = {
            "question": current_q["question"],
            "answer": answer,
            "answer_index": answer_index
        }
        if self.in_follow_up:
            data["follow_up_responses"].append(answer_data)
            self.current_follow_up_index += 1
        else:
            data["responses"].append(answer_data)            
            # Check if this question triggers follow-ups
            if "follow_ups" in current_q and answer_index is not None and answer_index > 0:  # Assuming index 0 is "No" and others trigger follow-ups
                self.in_follow_up = True
                self.current_follow_up_index = 0
            else:
                self.current_question_index += 1
        
        return True, data
    
    def get_progress(self):
        total_questions = len(self.questionnaire_data["questions"])
        if self.in_follow_up:
            return self.current_question_index + 1, total_questions
        return min(self.current_question_index + 1, total_questions), total_questions
    
    def get_results(self):
        return {
            "questionnaire": self.questionnaire_data["questionair"],
            "completion_status": "complete" if self.is_complete else "in_progress"
        }

# In-memory session storage (in production, use Redis or database)
questionnaire_sessions: Dict[str, QuestionnaireSession] = {}

def extract_text_from_chunk(chunk, model_name):
    """Extract text from chunk based on model-specific formats"""
    try:
        if chunk is None:
            return ""
        
        # Handle different chunk formats
        if isinstance(chunk, dict):
            # Try different possible keys
            for key in ["text", "answer", "content", "output", "generated_text"]:
                if key in chunk and chunk[key]:
                    return str(chunk[key])
            # If no specific key found, return string representation
            return str(chunk)
        elif isinstance(chunk, str):
            return chunk
        else:
            return str(chunk)
    except Exception as e:
        logger.error(f"Error extracting text from chunk for {model_name}: {e}")
        return ""

# Initialize database connection at startup
@app.on_event("startup")
async def startup_event():
    """Initialize database connection and insert dataset on startup"""
    global db
    try:
        logger.info("Starting up FastAPI application...")
        db = await connect_db()
        # result = await insert_dataset(db, "dataset1.json")
        # logger.info(f"Dataset insertion result: {result}")
    except Exception as e:
        logger.error(f"Error during startup: {e}")
        # Don't raise the exception to prevent app from failing to start

@app.get("/api/ping")
async def ping():
    """Health check endpoint"""
    return {"status": "ok", "message": "FastAPI server is running"}

@app.get("/api/models")
async def get_available_models():
    """Get list of available models"""
    return {"models": list(MODELS.keys())}

@app.get("/api/questionnaires")
async def get_questionnaires():
    """Get list of available questionnaires"""
    try:
        questionnaires = await list_questionairs(db)
        return {"questionnaires": questionnaires}
    except Exception as e:
        logger.error(f"Error fetching questionnaires: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching questionnaires: {str(e)}")


@app.post("/api/questionnaire/start")
async def start_questionnaire(request: QuestionnaireStartRequest):
    """Start a new questionnaire session"""
    if not request.tnc_accepted:
        raise HTTPException(status_code=400, detail="Terms and Conditions must be accepted to start the questionnaire")
    try:
        # Get questionnaire data from database
        questionnaire_data = await get_questionair(db, request.questionnaire_name)
        if not questionnaire_data:
            raise HTTPException(status_code=404, detail=f"Questionnaire '{request.questionnaire_name}' not found")
        
        # Generate session ID if not provided
        session_id = request.session_id or f"session_{request.student_name}_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Create new session
        session = QuestionnaireSession(questionnaire_data, session_id)
        questionnaire_sessions[session_id] = session
        
        db["chats"].insert_one({
            "session_id": session_id,
            "student_name": request.student_name,
            "student_dob": request.student_dob,
            "student_gender": request.student_gender,
            "gaurdian_role": "parent" if request.parent_name else "teacher",
            "gaurdian_name": request.parent_name if request.parent_name else request.teacher_name,
            "questionnaire_name": request.questionnaire_name,
            "responses" : [],
            "follow_up_responses": [],
            "conversation": []
        })
        # Get first question
        first_question = session.get_current_question()
        if not first_question:
            raise HTTPException(status_code=500, detail="No questions found in questionnaire")
        
        current_q_num, total_q = session.get_progress()
        
        return QuestionnaireResponse(
            session_id=session_id,
            question=first_question["question"],
            options=first_question["options"],
            question_number=current_q_num,
            total_questions=total_q,
            is_complete=False
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting questionnaire: {e}")
        raise HTTPException(status_code=500, detail=f"Error starting questionnaire: {str(e)}")

@app.post("/api/questionnaire/answer")
async def answer_questionnaire(request: QuestionnaireAnswerRequest):
    """Submit an answer and get the next question"""
    try:
        # Get session
        session = questionnaire_sessions.get(request.session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        data = await db['chats'].find_one({"session_id": request.session_id})
        # Submit answer
        success, updated_data = session.answer_question(request.answer, request.answer_index, data)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to submit answer")
        
        try :
            await db['chats'].update_one(
                {"session_id": request.session_id},
                {"$set": {
                    "responses": updated_data["responses"],
                    "follow_up_responses": updated_data["follow_up_responses"]
                }}
            )

        except Exception as db_error:
            print(f"Database error: {db_error}")
            raise HTTPException(status_code=500, detail="Database update failed")
        
        # Check if questionnaire is complete
        if session.is_complete:
            response = await db['chats'].find_one({"session_id": request.session_id})
            return QuestionnaireResponse(
                session_id=request.session_id,
                question="Thank you for completing the questionnaire!",
                options=[],
                question_number=session.get_progress()[0],
                total_questions=session.get_progress()[1],
                is_complete=True,
                results= {
                    "responses" : response.get("responses", []),
                    "follow_up_responses": response.get("follow_up_responses", []),
                    "conversation": response.get("conversation", []),
                }
            )
        
        # Get next question
        next_question = session.get_current_question()
        if not next_question:
            session.is_complete = True
            results = session.get_results()
            return QuestionnaireResponse(
                session_id=request.session_id,
                question="Thank you for completing the questionnaire!",
                options=[],
                question_number=session.get_progress()[0],
                total_questions=session.get_progress()[1],
                is_complete=True,
                results=results
            )
        
        current_q_num, total_q = session.get_progress()
        
        return QuestionnaireResponse(
            session_id=request.session_id,
            question=next_question["question"],
            options=next_question["options"],
            question_number=current_q_num,
            total_questions=total_q,
            is_complete=False,
            follow_up_triggered=session.in_follow_up
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing answer: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing answer: {str(e)}")

@app.get("/api/questionnaire/session/{session_id}")
async def get_questionnaire_session(session_id: str):
    """Get current session status"""
    session = questionnaire_sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    current_question = session.get_current_question()
    current_q_num, total_q = session.get_progress()
    
    if session.is_complete or not current_question:
        return QuestionnaireResponse(
            session_id=session_id,
            question="Questionnaire completed",
            options=[],
            question_number=current_q_num,
            total_questions=total_q,
            is_complete=True,
            results=session.get_results()
        )
    
    return QuestionnaireResponse(
        session_id=session_id,
        question=current_question["question"],
        options=current_question["options"],
        question_number=current_q_num,
        total_questions=total_q,
        is_complete=False,
        follow_up_triggered=session.in_follow_up
    )

@app.delete("/api/questionnaire/session/{session_id}")
async def delete_questionnaire_session(session_id: str):
    """Delete a questionnaire session"""
    if session_id in questionnaire_sessions:
        del questionnaire_sessions[session_id]
        return {"message": "Session deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="Session not found")

# Regular chat endpoints (unchanged)
@app.post("/api/chat")
async def chat(request: ChatRequest):
    """
    Non-streaming chat endpoint
    Returns complete response at once
    """
    try:
        # Validate question
        if not request.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")
        
        # Get model and create chain
        llm = MODELS[request.model]
        rag_chain = get_chain(llm=llm, age=request.age)
        
        # Generate response
        response = await rag_chain.ainvoke({
            "input": request.question,
            "context": "",  # Empty context since no retrieval
            "chat_history": "",  # Empty for independent requests
            "age": request.age
        })
        
        return ChatResponse(answer=response, model_used=request.model, options=[])
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

@app.post("/api/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    Streaming chat endpoint
    Returns response as Server-Sent Events
    """
    try:
        # Validate model
        if request.model not in MODELS:
            raise HTTPException(
                status_code=400, 
                detail=f"Model '{request.model}' not available. Available models: {list(MODELS.keys())}"
            )
        
        # Validate question
        if not request.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")
        
        # Validate age
        if request.age < 1 or request.age > 100:
            raise HTTPException(status_code=400, detail="Age must be between 1 and 100")
        
        # Get model and create chain
        llm = MODELS[request.model]
        chat_history = await get_chat(db, request.session_id)
        print("chathistoy: ",chat_history['responses'])
        rag_chain = get_chain(llm=llm, age=request.age, chat_history=chat_history)
        
        async def generate_stream():
            try:
                full_answer = ""
                chunk_count = 0
                
                logger.info(f"Starting stream for model: {request.model}")
                
                # Check if the chain supports streaming
                if hasattr(rag_chain, 'astream'):
                    # Use streaming if available
                    try:
                        async for chunk in rag_chain.astream({
                            "input": request.question,
                            "context": "",
                            "chat_history": chat_history,
                            "age": request.age
                        }):
                            chunk_count += 1
                            logger.info(f"Received chunk {chunk_count} for {request.model}: {type(chunk)}")
                            
                            chunk_text = extract_text_from_chunk(chunk, request.model)
                            
                            if chunk_text:
                                full_answer += chunk_text
                                
                                # Format as Server-Sent Event
                                data = {
                                    "chunk": chunk_text,
                                    "model": request.model,
                                    "complete": False
                                }
                                yield f"data: {json.dumps(data)}\n\n"
                                
                    except StopAsyncIteration:
                        logger.info(f"Stream completed normally for {request.model}")
                    except Exception as stream_error:
                        logger.error(f"Stream error for {request.model}: {stream_error}")
                        # Fall back to non-streaming
                        response = await rag_chain.ainvoke({
                            "input": request.question,
                            "context": "",
                            "chat_history": "",
                            "age": request.age
                        })
                        full_answer = str(response)
                        
                        # Send as single chunk
                        data = {
                            "chunk": full_answer,
                            "model": request.model,
                            "complete": False
                        }
                        yield f"data: {json.dumps(data)}\n\n"
                        
                else:
                    # Use non-streaming invoke if astream is not available
                    logger.info(f"Using non-streaming for {request.model}")
                    response = await rag_chain.ainvoke({
                        "input": request.question,
                        "context": "",
                        "chat_history": "",
                        "age": request.age
                    })
                    full_answer = str(response)
                    
                    # Send as single chunk
                    data = {
                        "chunk": full_answer,
                        "model": request.model,
                        "complete": False
                    }
                    yield f"data: {json.dumps(data)}\n\n"
                
                # Send completion signal
                completion_data = {
                    "chunk": "",
                    "model": request.model,
                    "complete": True,
                    "full_answer": full_answer
                }
                yield f"data: {json.dumps(completion_data)}\n\n"
                
                logger.info(f"Stream completed for {request.model}, total chunks: {chunk_count}")
                
            except Exception as e:
                logger.error(f"Error in generate_stream for {request.model}: {e}")
                # Send error as stream
                error_data = {
                    "error": str(e),
                    "model": request.model,
                    "complete": True
                }
                yield f"data: {json.dumps(error_data)}\n\n"
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream",
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error setting up stream: {e}")
        raise HTTPException(status_code=500, detail=f"Error setting up stream: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)