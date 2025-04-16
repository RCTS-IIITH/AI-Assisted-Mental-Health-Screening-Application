from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from bson.objectid import ObjectId
from ..models.db import Database
from ..utils.helpers import make_json_serializable
import datetime

questionnaire_bp = Blueprint('questionnaire', __name__)

@questionnaire_bp.route("/view_questionnaire", methods=["GET"])
@cross_origin(origin="http://localhost:3000", supports_credentials=True)
def view_questionnaire():
    question_list = list(
        Database.questionnaire.find(
            {}, {"_id": 1, "name": 1, "author": 1, "created_at": 1, "updated_at": 1}
        )
    )
    return jsonify(make_json_serializable(question_list)), 200

@questionnaire_bp.route("/questionnaire", methods=["POST"])
@cross_origin(origin="http://localhost:3000", supports_credentials=True)
def create_questionnaire():
    data = request.form
    questionnaire_name = data["name"]
    author = data["author"]

    questionnaire_id = Database.questionnaire.insert_one(
        {
            "name": questionnaire_name,
            "author": author,
            "created_at": datetime.datetime.utcnow(),
            "updated_at": datetime.datetime.utcnow(),
            "questions": [],
        }
    ).inserted_id

    return jsonify({"message": "Questionnaire created", "id": str(questionnaire_id)}), 201

@questionnaire_bp.route("/questionnaire/<questionnaire_id>/view", methods=["GET"])
@cross_origin(origin="http://localhost:3000", supports_credentials=True)
def get_questionnaire_dets(questionnaire_id):
    curr_questionnaire = Database.questionnaire.find_one(
        {"_id": ObjectId(questionnaire_id)}, {"name": 1}
    )
    return jsonify({"name": curr_questionnaire.get("name")}), 200

@questionnaire_bp.route("/questionnaire/<questionnaire_id>/questions", methods=["GET"])
@cross_origin(origin="http://localhost:3000", supports_credentials=True)
def get_questionnaire_questions(questionnaire_id):
    questionnaire_object = Database.questionnaire.find_one({"_id": ObjectId(questionnaire_id)})
    question_list = []
    
    for question_id in questionnaire_object["questions"]:
        question = Database.questions.find_one({"_id": question_id})
        if question:
            question_list.append(question)
            
    return jsonify(make_json_serializable(question_list)), 200

@questionnaire_bp.route("/set_questionnaire_type", methods=["POST"])
def set_questionnaire_type():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    questionnaire_id = data.get("questionnaireId")
    questionnaire_type = data.get("type")

    if not questionnaire_id or not questionnaire_type:
        return jsonify({"error": "questionnaireId and type are required"}), 400

    valid_types = ["child", "parent", "teacher"]
    if questionnaire_type not in valid_types:
        return jsonify({"error": f"Invalid type. Must be one of: {', '.join(valid_types)}"}), 400

    try:
        filter_query = {"type": questionnaire_type}
        update_query = {
            "$set": {
                "questionnaireId": questionnaire_id,
                "type": questionnaire_type,
            }
        }

        existing_document = Database.active.find_one(filter_query)
        if existing_document:
            Database.active.update_one(filter_query, update_query)
            message = f"{questionnaire_type.capitalize()} questionnaire updated"
        else:
            Database.active.insert_one({
                "questionnaireId": questionnaire_id,
                "type": questionnaire_type,
            })
            message = f"{questionnaire_type.capitalize()} questionnaire inserted"

        return jsonify({
            "message": message,
            "questionnaireId": questionnaire_id,
            "type": questionnaire_type,
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500 