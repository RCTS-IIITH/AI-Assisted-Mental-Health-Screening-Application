import os
import random
import bcrypt
import jwt
from datetime import datetime, timedelta
from fastapi import HTTPException, Depends, Header
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from twilio.rest import Client
from typing import Optional


load_dotenv()
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    password_bytes = password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)

def create_access_token(data: dict) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
        
async def send_otp(mobile):
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    verification_sid = os.getenv("TWILIO_VERIFICATION_SID")
    client = Client(account_sid, auth_token)
    verification = client.verify \
        .v2 \
        .services(verification_sid) \
        .verifications \
        .create(to=f'+91{mobile}', channel='sms')
    return verification.status

async def verify_otp(mobile, otp):
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    verification_sid = os.getenv("TWILIO_VERIFICATION_SID")
    client = Client(account_sid, auth_token)
    verification_check = client.verify \
        .v2 \
        .services(verification_sid) \
        .verification_checks \
        .create(to=f'+91{mobile}', code=otp)
    return verification_check.status