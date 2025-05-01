from fastapi import FastAPI, HTTPException, Depends, Body, Query, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
import logging
import os
import json
from datetime import datetime
import uuid
from dotenv import load_dotenv
import aiohttp

# Load environment variables
load_dotenv()

# Import local modules
from services.database import init_db, close_connections, get_user_by_email, get_user_by_id, store_conversation, get_conversation_history
from services.age_based_query import QueryGenerator, AgeGroup
from services.vector_store import VectorStore
from services.scoring_system import ScoringSystem, Category, Assessment
from adapters.huggingface_adapter import HuggingFaceAdapter
from utils.prompts import PromptTemplates
from utils.memory import ConversationMemory

# Groq Adapter
class GroqAdapter:
    """Adapter for Groq's API"""
    
    def __init__(self, api_key: Optional[str] = None, model: str = "mixtral-8x7b-32768"):
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("Groq API key is required")
        self.base_url = "https://api.groq.com/openai/v1"
        self.model = model
        self.embedding_model = None  # Groq does not support embeddings
        
    async def generate_response(self, 
                               prompt: str, 
                               history: Optional[List[Dict[str, str]]] = None,
                               system_prompt: Optional[str] = None,
                               temperature: float = 0.7,
                               max_tokens: int = 1000) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        if history:
            for entry in history:
                messages.append({"role": "user", "content": entry["user"]})
                if "assistant" in entry:
                    messages.append({"role": "assistant", "content": entry["assistant"]})
        messages.append({"role": "user", "content": prompt})
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        return f"Error: {error_text}"
                    data = await response.json()
                    return data["choices"][0]["message"]["content"]
            except Exception as e:
                print(f"Error generating Groq response: {e}")
                return f"Error: {str(e)}"
    
    async def embed_text(self, text: str) -> List[float]:
        print("Warning: Groq API does not support embedding generation")
        return [0.0] * 1024  # Placeholder dimension
    
    def get_tokenizer(self):
        return lambda text: text.split()
    
    def count_tokens(self, text: str) -> int:
        return int(len(self.get_tokenizer()(text)) * 1.2)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Mental Health Screening API",
    description="API for age-based mental health screening using conversational AI",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Pydantic Models
class UserCreate(BaseModel):
    email: str = Field(..., example="user@example.com")
    age: int = Field(..., ge=0, le=120, example=25)
    name: Optional[str] = Field(None, example="John Doe")

class UserResponse(BaseModel):
    id: str
    email: str
    age: int
    name: Optional[str]
    created_at: datetime

class MessageRequest(BaseModel):
    message: str = Field(..., example="I'm feeling anxious lately.")
    metadata: Optional[Dict[str, Any]] = Field(None, example={"user_id": "123"})

class MessageResponse(BaseModel):
    response: str
    conversation_id: str
    timestamp: datetime

class AssessmentRequest(BaseModel):
    user_id: str
    categories: List[str] = Field(..., example=["anxiety", "depression"])  # Changed Category to str for simplicity

class AssessmentResponse(BaseModel):
    assessment_id: str
    user_id: str
    scores: Dict[str, float]
    recommendations: List[str]
    timestamp: datetime

# Database Dependency (Moved before endpoints to fix undefined error)
async def get_db():
    from services.database import async_db
    return async_db

# Other Dependencies
async def get_llm_adapter():
    return GroqAdapter()

async def get_hf_adapter():
    return HuggingFaceAdapter()

async def get_vector_store():
    return VectorStore()

async def get_scoring_system():
    return ScoringSystem()

# Startup and Shutdown Events
@app.on_event("startup")
async def startup_event():
    await init_db()
    logger.info("Application started and database initialized")

@app.on_event("shutdown")
async def shutdown_event():
    close_connections()
    logger.info("Application shutdown and database connections closed")

# Background Task for Logging
async def log_interaction(user_id: str, message: str, response: str, metadata: Dict):
    logger.info(f"User {user_id} interaction - Message: {message}, Response: {response}, Metadata: {metadata}")

# API Endpoints
@app.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate, db=Depends(get_db)):
    existing_user = await get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "_id": user_id,
        "email": user.email,
        "age": user.age,
        "name": user.name,
        "created_at": datetime.utcnow()
    }
    await db.users_collection.insert_one(user_doc)
    return UserResponse(id=user_id, **user_doc)

@app.post("/conversations", response_model=MessageResponse)
async def handle_conversation(
    request: MessageRequest,
    background_tasks: BackgroundTasks,
    llm: GroqAdapter = Depends(get_llm_adapter),
    vector_store: VectorStore = Depends(get_vector_store),
    db=Depends(get_db)
):
    # Get user and conversation history
    user_id = request.metadata.get("user_id") if request.metadata else None
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID required in metadata")
    
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    history = await get_conversation_history(user_id, limit=5)
    age_group = AgeGroup.from_age(user["age"])
    query_generator = QueryGenerator(age_group)
    
    # Generate system prompt
    system_prompt = PromptTemplates.get_screening_prompt(age_group)
    
    # Generate response
    conversation_memory = ConversationMemory(history)
    prompt = conversation_memory.format_prompt(request.message)
    
    response = await llm.generate_response(
        prompt=prompt,
        history=history,
        system_prompt=system_prompt,
        temperature=0.7,
        max_tokens=1000
    )
    
    # Store conversation
    conversation_id = await store_conversation(
        user_id=user_id,
        message=request.message,
        response=response,
        metadata=request.metadata or {}
    )
    
    # Log interaction in background
    background_tasks.add_task(log_interaction, user_id, request.message, response, request.metadata or {})
    
    # Update vector store (for semantic search)
    await vector_store.add_conversation(
        conversation_id=conversation_id,
        text=f"{request.message} {response}",
        metadata={"user_id": user_id, "timestamp": datetime.utcnow()}
    )
    
    return MessageResponse(
        response=response,
        conversation_id=conversation_id,
        timestamp=datetime.utcnow()
    )

@app.post("/assessments", response_model=AssessmentResponse)
async def generate_assessment(
    request: AssessmentRequest,
    llm: GroqAdapter = Depends(get_llm_adapter),
    scoring_system: ScoringSystem = Depends(get_scoring_system),
    db=Depends(get_db)
):
    user = await get_user_by_id(request.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get conversation history for context
    history = await get_conversation_history(request.user_id, limit=10)
    
    # Generate assessment questions
    age_group = AgeGroup.from_age(user["age"])
    query_generator = QueryGenerator(age_group)
    questions = query_generator.generate_assessment_questions(request.categories)
    
    # Simulate user responses (in practice, this would come from conversation history)
    scores = {}
    recommendations = []
    
    for category in request.categories:
        # Use LLM to analyze conversation history for scoring
        prompt = PromptTemplates.get_assessment_prompt(category, history)
        analysis = await llm.generate_response(
            prompt=prompt,
            system_prompt=PromptTemplates.get_system_prompt(age_group),
            temperature=0.5,
            max_tokens=500
        )
        
        # Score the category
        score = scoring_system.calculate_score(category, analysis)
        scores[category] = score
        
        # Generate recommendations
        recommendations.extend(scoring_system.get_recommendations(category, score))
    
    # Store assessment
    assessment_id = str(uuid.uuid4())
    assessment_doc = {
        "_id": assessment_id,
        "user_id": request.user_id,
        "scores": scores,
        "recommendations": recommendations,
        "timestamp": datetime.utcnow()
    }
    await db.assessments_collection.insert_one(assessment_doc)
    
    return AssessmentResponse(**assessment_doc)

@app.get("/resources")
async def get_resources(
    query: Optional[str] = Query(None, description="Search query for resources"),
    vector_store: VectorStore = Depends(get_vector_store),
    hf_adapter: HuggingFaceAdapter = Depends(get_hf_adapter),
    db=Depends(get_db)
):
    if query:
        # Use HuggingFace adapter for embeddings since Groq doesn't support them
        embedding = await hf_adapter.embed_text(query)
        results = await vector_store.search(embedding, limit=10)
    else:
        results = await db.resources_collection.find().limit(10).to_list(length=10)
    
    return [{"id": str(r["_id"]), "content": r.get("content", ""), "metadata": r.get("metadata", {})} for r in results]

# Run the app (for local testing)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)