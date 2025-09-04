from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from models.chatbot import ChatRequest
from database.chatbot import get_chat, get_embedding, store_chat_response
from utils.rag_chain import get_chain
from utils.utils import MODELS, questions_asked, questions, last_question_index, status
import json
import logging
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

router = APIRouter()
logger = logging.getLogger(__name__)

def extract_text_from_chunk(chunk, model_name):
    try:
        if chunk is None:
            return ""
        if isinstance(chunk, dict):
            for key in ["text", "answer", "content", "output", "generated_text"]:
                if key in chunk and chunk[key]:
                    return str(chunk[key])
            return str(chunk)
        elif isinstance(chunk, str):
            return chunk
        else:
            return str(chunk)
    except Exception as e:
        logger.error(f"Error extracting text from chunk for {model_name}: {e}")
        return ""

def sim_search(user_embedding, questions_list, asked_questions_set):
    user_vector = np.array(user_embedding).reshape(1, -1)
    max_sim = -1
    best_question = None

    for i in range(len(questions_list)):
        if i in asked_questions_set:
            continue
        if questions_list[i].get("type", 0) == 1:
            continue
        q_vec = np.array(questions_list[i]["question_vector"]).reshape(1, -1)
        sim = cosine_similarity(user_vector, q_vec)[0][0]
        if sim > max_sim:
            max_sim = sim
            best_question = i

    if best_question is None:
        for i in range(len(questions_list)):
            if i in asked_questions_set:
                continue
            if questions_list[i].get("type", 0) == 0:
                continue
            q_vec = np.array(questions_list[i]["question_vector"]).reshape(1, -1)
            sim = cosine_similarity(user_vector, q_vec)[0][0]
            if sim > max_sim:
                max_sim = sim
                best_question = i

    return best_question, max_sim

@router.post("/stream")
async def chat_stream(request: ChatRequest):
    try:
        if request.model not in MODELS:
            raise HTTPException(
                status_code=400,
                detail=f"Model '{request.model}' not available. Available models: {list(MODELS.keys())}"
            )

        # Store user message
        await store_chat_response(router.db, request.session_id, "user", [], request.question)

        # Get model and chat history
        llm = MODELS[request.model]
        chat_history = await get_chat(router.db, request.session_id)

        session_questions = questions.get(request.session_id)
        if not session_questions:
            raise HTTPException(status_code=400, detail="No questions available for this session")

        if request.question.strip().lower() == "/start":
            best_question_index = 0
            last_question_index[request.session_id] = 0

        elif len(request.question.strip().split(' ')) <= 3 and -last_question_index.get(request.session_id, 0) - 1 not in questions_asked.get(request.session_id, set()):
            best_question_index = -last_question_index.get(request.session_id, 0) - 1

        else:
            text = ""
            for conv in chat_history.get('conversation', [])[-6:]:
                text += " " + f"{conv.get('message', '')}"
            user_embedding = await get_embedding(request.question + text)
            best_question_index, _ = sim_search(
                user_embedding,
                session_questions,
                questions_asked.setdefault(request.session_id, set())
            )
            last_question_index[request.session_id] = best_question_index

        if best_question_index is not None and best_question_index < 0:
            best_question = "Can you please elaborate on that?"
            questions_asked.setdefault(request.session_id, set()).add(best_question_index)

        elif best_question_index is None:
            best_question = "The questionnaire is complete. Thank you for your responses! Please provide us with any additional comments or feedback."
            status[request.session_id] = True

        else:
            questions_asked.setdefault(request.session_id, set()).add(best_question_index)
            best_question = session_questions[best_question_index]['question']

        rag_chain = get_chain(
            llm=llm,
            age=request.age,
            chat_history=chat_history,
            question=best_question
        )

        async def generate_stream():
            try:
                full_answer = ""
                chunk_count = 0

                logger.info(f"Starting stream for model: {request.model}")

                if hasattr(rag_chain, 'astream'):
                    try:
                        async for chunk in rag_chain.astream({
                            "input": request.question,
                            "question": best_question,
                            "context": "",
                            "conversation": chat_history.get('conversation', []),
                            "age": request.age
                        }):
                            chunk_count += 1
                            logger.info(f"Received chunk {chunk_count} for {request.model}: {type(chunk)}")
                            chunk_text = extract_text_from_chunk(chunk, request.model)
                            if chunk_text:
                                full_answer += chunk_text
                                data = {
                                    "chunk": chunk_text,
                                    "complete": False
                                }
                                yield f"data: {json.dumps(data)}\n\n"
                    except StopAsyncIteration:
                        logger.info(f"Stream completed normally for {request.model}")

                else:
                    logger.info(f"Using non-streaming for {request.model}")
                    response = await rag_chain.ainvoke({
                        "input": request.question,
                        "question": best_question,
                        "context": "",
                        "responses": chat_history.get('responses', []),
                        "follow_up_responses": chat_history.get('follow_up_responses', []),
                        "conversation": chat_history.get('conversation', []),
                        "age": request.age
                    })
                    full_answer = str(response)
                    data = {
                        "chunk": full_answer,
                        "complete": False
                    }
                    yield f"data: {json.dumps(data)}\n\n"

                completion_data = {
                    "chunk": "",
                    "model": request.model,
                    "status": status.get(request.session_id, False),
                    "complete": True,
                    "full_answer": full_answer
                }
                yield f"data: {json.dumps(completion_data)}\n\n"

                await store_chat_response(router.db, request.session_id, "bot", [best_question_index, best_question], full_answer)

                logger.info(f"Stream completed for {request.model}, total chunks: {chunk_count}")

            except Exception as e:
                logger.error(f"Error in generate_stream for {request.model}: {e}")
                error_data = {
                    "error": str(e),
                    "model": request.model,
                    "status": status.get(request.session_id, False),
                    "complete": True
                }
                yield f"data: {json.dumps(error_data)}\n\n"

        return StreamingResponse(
            generate_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error setting up stream: {e}")
        raise HTTPException(status_code=500, detail=f"Error setting up stream: {e}")