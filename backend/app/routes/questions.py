from flask import Blueprint, request, jsonify, send_from_directory, current_app
from flask_cors import cross_origin
from bson.objectid import ObjectId
from ..models.db import Database
import os
import datetime

questions_bp = Blueprint('questions', __name__)

@questions_bp.route("/questions", methods=["POST"])
def create_question():
    data = request.form
    question_text = data.get("question_text")
    question_type = data.get("type")
    tags = data.getlist("tags")
    questionnaire_id = data.get("questionnaire_id")
    tag = data.get("question_tag")

    question_data = {
        "questionnaire_id": ObjectId(questionnaire_id),
        "question_text": question_text,
        "type": question_type,
        "tags": tag,
        "created_at": datetime.datetime.utcnow(),
        "updated_at": datetime.datetime.utcnow(),
    }

    if "question_image" in request.files:
        question_image = request.files["question_image"]
        question_image_filename = f"{datetime.datetime.utcnow().timestamp()}-ques.jpg"
        question_image_path = os.path.join(
            current_app.config["UPLOAD_FOLDER"], question_image_filename
        )
        question_image.save(question_image_path)
        question_data["question_image"] = question_image_filename

    question_id = Database.questions.insert_one(question_data).inserted_id

    options = []
    option_index = 0
    while (
        f"option_text_{option_index}" in data
        or f"option_image_{option_index}" in request.files
    ):
        option = {"text": data.get(f"option_text_{option_index}"), "image": None}

        if f"option_image_{option_index}" in request.files:
            option_image = request.files[f"option_image_{option_index}"]
            option_image_filename = f"{question_id}-option_{option_index}.jpg"
            option_image_path = os.path.join(
                current_app.config["UPLOAD_FOLDER"], option_image_filename
            )
            option_image.save(option_image_path)
            option["image"] = option_image_filename

        options.append(option)
        option_index += 1

    Database.questions.update_one(
        {"_id": ObjectId(question_id)}, 
        {"$set": {"options": options}}
    )

    Database.questionnaire.update_one(
        {"_id": ObjectId(questionnaire_id)}, 
        {"$push": {"questions": question_id}}
    )

    return jsonify({"message": "Question created", "id": str(question_id)}), 201

@questions_bp.route("/questions", methods=["GET"])
def view_questions():
    question_list = list(
        Database.questions.find(
            {}, {"_id": 1, "question_text": 1, "type": 1, "tags": 1, "options": 1}
        )
    )
    for question in question_list:
        question["_id"] = str(question["_id"])
        question_image_filename = f"{question['_id']}-ques.jpg"
        question["question_image"] = (
            f"/images/{question_image_filename}"
            if os.path.exists(
                os.path.join(current_app.config["UPLOAD_FOLDER"], question_image_filename)
            )
            else None
        )

        for i, option in enumerate(question.get("options", [])):
            if option.get("image"):
                option_image_filename = f"{question['_id']}-option_{i}.jpg"
                option["image"] = (
                    f"/images/{option_image_filename}"
                    if os.path.exists(
                        os.path.join(current_app.config["UPLOAD_FOLDER"], option_image_filename)
                    )
                    else None
                )

    return jsonify(question_list), 200

@questions_bp.route("/images/<filename>")
def serve_image(filename):
    return send_from_directory(current_app.config["UPLOAD_FOLDER"], filename) 