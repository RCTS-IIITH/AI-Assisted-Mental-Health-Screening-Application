from pydantic import BaseModel
from typing import Optional

class ChatRequest(BaseModel):
    session_id: str
    question: str
    model: str = "Mistral"
    age: int = 15

class QuestionnaireStartRequest(BaseModel):
    session_id: Optional[str] = None
    student_name: str
    student_dob: str
    student_gender: str
    parent_name: str
    parent_mobile: str
    school: str
    teacher_name: Optional[str] = None
    teacher_mobile: Optional[str] = None
    questionnaire_name: str
    tnc_accepted: bool

class EndRequest(BaseModel):
    session_id: str
    feedback: str

class UpdateDiagnosisRequest(BaseModel):
    session_id: str
    diagnosis: str