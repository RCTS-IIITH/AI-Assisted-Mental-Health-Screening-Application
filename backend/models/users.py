from pydantic import BaseModel
from typing import Optional

class UserSignup(BaseModel):
    role: str
    name: str
    school: Optional[str] = None
    mobile: str
    password: str
    otp: str

class UserLogin(BaseModel):
    mobile: str
    password: str

class ChangePass(BaseModel):
    mobile: str
    password: str

class SendOtpRequest(BaseModel):
    mobile: str

class VerifyOtpRequest(BaseModel):
    mobile: str
    otp: str