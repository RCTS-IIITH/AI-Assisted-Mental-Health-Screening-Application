from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from bson.objectid import ObjectId
from ..models.db import Database
from ..utils.helpers import make_json_serializable

children_bp = Blueprint('children', __name__)

"""
Child management routes for handling child data and relationships
"""

@children_bp.route("/children", methods=["GET"])
@cross_origin(origin="http://localhost:3000", supports_credentials=True)
def get_children():
    """
    Lists down the children for both parent dashboard and teacher dashboard
    
    Query Parameters:
    - user_type: str (parent/teacher)
    - parent_id: str (if user_type is parent)
    - school: str (if user_type is teacher)
    
    Returns:
    - JSON array of children with their details
    """
    user_type = request.args.get("user_type")
    user_type = user_type.lower()

    if user_type == "parent":
        parent_id = request.args.get("parent_id")
        children_list = list(Database.children.find({"ParentId": ObjectId(parent_id)}))
        for child in children_list:
            child["_id"] = str(child["_id"])
            child["ParentId"] = str(child["ParentId"])
        return jsonify(children_list), 200
    
    elif user_type == "teacher":
        school = request.args.get("school")
        children_list = list(Database.children.find({"School": school}))
        for child in children_list:
            child["_id"] = str(child["_id"])
            child["ParentId"] = str(child["ParentId"])
        return jsonify(children_list), 200
    else:
        return jsonify({"error": "Invalid user type"}), 400

@children_bp.route("/children/add", methods=["POST"])
def add_child():
    """
    Add a new child to the database
    
    Request Body:
    - name: str (child's name)
    - age: int (child's age)
    - parent_id: str (MongoDB ObjectId of parent)
    - school_name: str (name of child's school)
    
    Returns:
    - JSON with success message and child_id if successful
    - JSON with error message if child already exists or invalid data
    """
    data = request.get_json()
    
    # Check if child data already exists
    existing_child = Database.children.find_one({
        "name": data["name"],
        "age": data["age"],
        "parent_id": ObjectId(data["parent_id"]),
        "school_name": data["school_name"]
    })
    
    if existing_child:
        return jsonify({"error": "Child already exists"}), 400
    
    # Add new child
    child_data = {
        "name": data["name"],
        "age": data["age"],
        "parent_id": ObjectId(data["parent_id"]),
        "school_name": data["school_name"]
    }
    
    result = Database.children.insert_one(child_data)
    return jsonify({"message": "Child added successfully", "child_id": str(result.inserted_id)}), 201 