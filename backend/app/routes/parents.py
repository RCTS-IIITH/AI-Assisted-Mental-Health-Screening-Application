from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from ..models.db import Database
from bson import ObjectId

parents_bp = Blueprint('parents', __name__)

"""
Parent management routes for handling parent registration and authentication
"""

@parents_bp.route("/parents/register", methods=["POST"])
@cross_origin(origin="http://localhost:3000", supports_credentials=True)
def register_parent():
    """
    Register a new parent in the system
    
    Request Body:
    - email: str (parent's email address)
    - password: str (parent's password)
    - name: str (parent's full name)
    - phone: str (parent's phone number)
    
    Returns:
    - JSON with success message and parent_id if successful
    - JSON with error message if parent already exists or invalid data
    """
    data = request.get_json()
    
    # Check if parent already exists
    existing_parent = Database.parents.find_one({"email": data["email"]})
    if existing_parent:
        return jsonify({"error": "Email already registered"}), 400
    
    # Create new parent
    parent_data = {
        "email": data["email"],
        "password": data["password"],  # Note: Should be hashed in production
        "name": data["name"],
        "phone": data["phone"],
        "user_type": "parent"
    }
    
    result = Database.parents.insert_one(parent_data)
    return jsonify({"message": "Parent registered successfully", "parent_id": str(result.inserted_id)}), 201

@parents_bp.route("/parents/login", methods=["POST"])
@cross_origin(origin="http://localhost:3000", supports_credentials=True)
def login_parent():
    """
    Authenticate a parent's login credentials
    
    Request Body:
    - email: str (parent's email address)
    - password: str (parent's password)
    
    Returns:
    - JSON with success message and parent data if authenticated
    - JSON with error message if authentication fails
    """
    data = request.get_json()
    
    # Find parent by email and password
    parent = Database.parents.find_one({
        "email": data["email"],
        "password": data["password"]  # Note: Should use password hashing in production
    })
    
    if not parent:
        return jsonify({"error": "Invalid email or password"}), 401
    
    # Convert ObjectId to string for JSON serialization
    parent["_id"] = str(parent["_id"])
    
    return jsonify({
        "message": "Login successful",
        "parent": parent
    }), 200 