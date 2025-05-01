from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime

class MessageRequest(BaseModel):
    """Model for incoming conversation messages."""
    message: str = Field(..., example="I'm feeling anxious lately.", description="User's message")
    metadata: Optional[Dict[str, Any]] = Field(None, example={"user_id": "123", "session_id": "abc"}, description="Metadata like user_id")

class MessageResponse(BaseModel):
    """Model for conversation response."""
    response: str = Field(..., example="I'm sorry to hear you're feeling anxious. Can you share more?", description="LLM response")
    conversation_id: str = Field(..., example="456e7890-f12c-34d5-b678-901234567890", description="Unique conversation ID")
    timestamp: datetime = Field(..., example="2025-04-30T12:00:00Z", description="Response timestamp")

class Conversation(BaseModel):
    """Model for storing conversations in MongoDB."""
    id: str = Field(..., alias="_id", example="456e7890-f12c-34d5-b678-901234567890")
    user_id: str = Field(..., example="123e4567-e89b-12d3-a456-426614174000", description="ID of the user")
    message: str = Field(..., example="I'm feeling anxious lately.", description="User's message")
    response: str = Field(..., example="I'm sorry to hear you're feeling anxious.", description="LLM response")
    timestamp: datetime = Field(..., example="2025-04-30T12:00:00Z", description="Conversation timestamp")
    metadata: Optional[Dict[str, Any]] = Field(None, example={"session_id": "abc"}, description="Additional metadata")
    vector: Optional[List[float]] = Field(None, example=[0.1, 0.2, ...], description="Vector embedding for RAG")

    class Config:
        allow_population_by_field_name = True