import jwt
import datetime
from flask import current_app
from bson.objectid import ObjectId

def generate_token(user_id):
    """
    Generate a JWT token for the given user_id
    
    Args:
        user_id: The user's MongoDB ObjectId
        
    Returns:
        str: JWT token
    """
    payload = {
        "user_id": str(user_id),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24),
    }
    token = jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")
    return token

def verify_token(token):
    """
    Verify and decode a JWT token
    
    Args:
        token: JWT token string
        
    Returns:
        dict: Decoded token payload or None if invalid
    """
    try:
        payload = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None 