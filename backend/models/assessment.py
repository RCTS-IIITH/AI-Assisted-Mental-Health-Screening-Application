from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime

class AssessmentRequest(BaseModel):
    """Model for requesting a mental health assessment."""
    user_id: str = Field(..., example="123e4567-e89b-12d3-a456-426614174000", description="ID of the user")
    categories: List[str] = Field(..., example=["anxiety", "depression"], description="Mental health categories to assess")

class AssessmentResponse(BaseModel):
    """Model for assessment results."""
    assessment_id: str = Field(..., example="789f0123-g45h-67i8-c901-234567890123", description="Unique assessment ID")
    user_id: str = Field(..., example="123e4567-e89b-12d3-a456-426614174000")
    scores: Dict[str, float] = Field(..., example={"anxiety": 0.75, "depression": 0.60}, description="Scores for each category")
    recommendations: List[str] = Field(..., example=["Consider mindfulness exercises", "Consult a therapist"], description="Recommended actions")
    timestamp: datetime = Field(..., example="2025-04-30T12:00:00Z")

class Assessment(BaseModel):
    """Model for storing assessments in MongoDB."""
    id: str = Field(..., alias="_id", example="789f0123-g45h-67i8-c901-234567890123")
    user_id: str = Field(..., example="123e4567-e89b-12d3-a456-426614174000")
    scores: Dict[str, float] = Field(..., example={"anxiety": 0.75, "depression": 0.60})
    recommendations: List[str] = Field(..., example=["Consider mindfulness exercises", "Consult a therapist"])
    timestamp: datetime = Field(..., example="2025-04-30T12:00:00Z")
    metadata: Optional[Dict[str, Any]] = Field(None, example={"model_version": "1.0"}, description="Additional metadata")

    class Config:
        allow_population_by_field_name = True