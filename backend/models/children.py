from pydantic import BaseModel
from typing import Optional

class ChildRequest(BaseModel):
    child_id: str

class AddChildRequest(BaseModel):
    name: str
    dob: str
    gender: str
    school: str
    parent_name: str
    parent_mobile: str
    teacher_name: Optional[str] = None
    teacher_mobile: Optional[str] = None

class GetChildren(BaseModel):
    mobile: str

class GetChildBySchool(BaseModel):
    school: str
