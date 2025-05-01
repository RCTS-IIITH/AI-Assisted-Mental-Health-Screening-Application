from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    """Model for creating a new user."""
    email: EmailStr = Field(..., example="user@example.com", description="User's email address")
    age: int = Field(..., ge=0, le=120, example=25, description="User's age for age-based queries")
    name: Optional[str] = Field(None, example="John Doe", description="User's name (optional)")

class UserResponse(BaseModel):
    """Model for user data returned in API responses."""
    id: str = Field(..., alias="_id", example="123e4567-e89b-12d3-a456-426614174000")
    email: EmailStr = Field(..., example="user@example.com")
    age: int = Field(..., example=25)
    name: Optional[str] = Field(None, example="John Doe")
    created_at: datetime = Field(..., example="2025-04-30T12:00:00Z")

    class Config:
        allow_population_by_field_name = True  # Allows using '_id' in MongoDB documents