from flask import Blueprint, request, jsonify
from ..models.db import Database
from ..utils.auth import generate_token

auth_bp = Blueprint('auth', __name__)

@auth_bp.route("/signup", methods=["POST"])
def signup():
    """
    Register a new user
    
    Request Body:
    - name: str
    - age: int
    - role: str (teacher/parent/psychologist)
    - schoolName: str (required if role is teacher)
    - phone: str
    
    Returns:
    - JSON with token and success message if registration successful
    - JSON with error message if phone number already exists
    """
    data = request.get_json()
    name = data.get("name")
    age = data.get("age")
    role = data.get("role").lower()
    schoolName = data.get("schoolName") if role == "teacher" else None
    phone = data.get("phone")

    # Check if the phone number already exists
    if Database.users.find_one({"phone": phone}):
        return jsonify({"error": "Phone number already exists"}), 409

    user_id = None
    if role == "teacher":
        user_id = Database.users.insert_one(
            {
                "name": name,
                "age": age,
                "role": role,
                "school": schoolName,
                "phone": phone,
            }
        ).inserted_id
    elif role == "parent" or role == "psychologist":
        user_id = Database.users.insert_one(
            {"name": name, "age": age, "role": role, "phone": phone}
        ).inserted_id
    else:
        return jsonify({"error": "Invalid role"}), 400
        
    token = generate_token(user_id)
    return jsonify({"token": token, "message": "User registered successfully"}), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Authenticate a user
    
    Request Body:
    - phone: str
    
    Returns:
    - JSON with token and user data if login successful
    - JSON with error message if phone number not found
    """
    data = request.get_json()
    phone = data.get("phone")

    # Check if the phone number exists in the database
    user = Database.users.find_one({"phone": phone})
    if user:
        # Generate JWT token for the user if phone number exists
        token = generate_token(user["_id"])
        user["_id"] = str(user["_id"])
        response_data = {
            "token": token,
            **user,
        }
        return jsonify(response_data), 200
    else:
        # Return an error message if phone number is not found
        return jsonify({"error": "Invalid phone number"}), 401 