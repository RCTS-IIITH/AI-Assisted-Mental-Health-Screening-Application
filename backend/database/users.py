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
from utils.users import hash_password, verify_password, create_access_token, verify_token, send_otp, verify_otp


load_dotenv()

async def get_current_user(db, authorization: Optional[str] = Header(None)):
    """Dependency to get current user from JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    token = authorization.split(" ")[1]
    payload = verify_token(token)
    
    # Get user from database
    user = await get_user_by_mobile(db, payload.get("mobile"))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    # Remove password from user object
    user_data = {k: v for k, v in user.items() if k != 'password'}
    return user_data

async def connect_users_db():
    """Connect to MongoDB database for users"""
    try:
        connection_string = os.getenv("CONNECTION_STRING")
        if not connection_string:
            raise Exception("CONNECTION_STRING environment variable not set.")

        client = AsyncIOMotorClient(connection_string)
        db = client["users_db"]
        # Test connection
        await db.command('ping')
        return db

    except Exception as e:
        raise Exception(f"Error connecting to users database: {e}")

async def create_user(db, user):
    """Create a new user with hashed password"""
    # Hash the password before storing
    if 'password' in user:
        user['password'] = hash_password(user['password'])
    del user['otp']
    await db.users.insert_one(user)

async def update_user_password(db, mobile, new_password):
    """Update user's password with hashed password"""
    hashed_password = hash_password(new_password)
    result = await db.users.update_one(
        {"mobile": mobile},
        {"$set": {"password": hashed_password}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found or password unchanged")
    return True

async def get_user_by_mobile(db, mobile):
    return await db.users.find_one({"mobile": mobile})

async def verify_user(db, mobile, password):
    """Verify user credentials with hashed password comparison"""
    user = await db.users.find_one({"mobile": mobile})
    if user and verify_password(password, user['password']):
        return user
    return None

