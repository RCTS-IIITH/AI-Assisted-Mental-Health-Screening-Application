from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from ..models.db import Database

active_bp = Blueprint('active', __name__)

"""
Active questionnaire management routes
"""

@active_bp.route("/questionnaire/active", methods=["GET"])
@cross_origin(origin="http://localhost:3000", supports_credentials=True)
def get_active_questionnaire():
    """
    Get the active questionnaire for a specific user type
    
    Query Parameters:
    - user_type: str (parent/teacher)
    
    Returns:
    - JSON with active questionnaire data if found
    - JSON with error message if no active questionnaire exists
    """
    user_type = request.args.get("user_type")
    user_type = user_type.lower()

    active_questionnaire = Database.active_questionnaires.find_one({"user_type": user_type})
    if active_questionnaire:
        active_questionnaire["_id"] = str(active_questionnaire["_id"])
        return jsonify(active_questionnaire), 200
    else:
        return jsonify({"error": "No active questionnaire found"}), 404 