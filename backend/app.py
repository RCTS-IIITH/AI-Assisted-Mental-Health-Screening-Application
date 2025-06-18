from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
import bcrypt
import jwt
from urllib.parse import unquote
import datetime
import os
import ast
from dotenv import load_dotenv
import json
from flask_cors import cross_origin

# Load environment variables
load_dotenv()


def run_function(func_string, funcinput, funcname="my_function"):
    # Execute the function definition in the current global scope
    exec(func_string, globals())
    # except

    # Retrieve the function from globals and call it
    if funcname in globals():
        func = globals()[funcname]  # Get the function by name
        result = func(funcinput)  # Call the function with input
        print(f"Result: {result}")
    else:
        print(f"Function '{funcname}' not found.")


# # Run the function

# Initialize Flask app
app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "your_default_secret_key")
app.config["UPLOAD_FOLDER"] = "images/"
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
# For uploaded files
DOC_UPLOAD_FOLDER = "uploads"
os.makedirs(DOC_UPLOAD_FOLDER, exist_ok=True)
app.config["DOC_UPLOAD_FOLDER"] = DOC_UPLOAD_FOLDER
CORS(
    app,
    resources={
        r"/*": {  # Allows all routes
            "origins": ["http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": [
                "Content-Type",
                "Authorization",
                "Access-Control-Allow-Credentials",
            ],
            "supports_credentials": True,
            "expose_headers": ["Access-Control-Allow-Origin"],
        }
    },
)
# MongoDB setup
try:
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    client = MongoClient(mongo_uri)
    db = client["projectdsi13"]

    
    users = db["users"]
    children = db["children"]
    questions = db["questions"]
    responses = db["responses"]
    questionnaire = db["questionnaire"]
    rubrics = db["rubrics"]
    active = db["active"]
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    raise e

# Helper function to generate JWT


def generate_token(user_id):
    payload = {
        "user_id": str(user_id),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24),
    }
    token = jwt.encode(payload, app.config["SECRET_KEY"], algorithm="HS256")
    return token


# Signup route


@app.route("/signup", methods=["POST"])
def signup():
    # data = request.get_json()
    # name = data.get("name")
    # age = data.get("age")
    # role = data.get("role")
    # if data.get("childName"):
    #     childName = data.get("childName")
    # else:
    #     childName = ""
    # email = data.get("email")
    # phone = data.get("phone")
    # password = data.get("password")

    # # Check if the email already exists
    # if users.find_one({"email": email}):
    #     return jsonify({"error": "Email already exists"}), 409

    # hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode(
    #     "utf-8"
    # )
    # user_id = users.insert_one(
    #     {
    #         "name": name,
    #         "age": age,
    #         "role": role,
    #         "childName": childName,
    #         "email": email,
    #         "phone": phone,
    #         "password": hashed_password,
    #     }
    # ).inserted_id

    # token = generate_token(user_id)
    # return jsonify({"token": token, "message": "User registered successfully"}), 201
    data = request.get_json()
    name = data.get("name")
    age = data.get("age")
    role = data.get("role")
    role = role.lower()
    schoolName = data.get("schoolName") if role == "teacher" else None
    phone = data.get("phone")

    # Check if the phone number already exists
    if users.find_one({"phone": phone}):
        return jsonify({"error": "Phone number already exists"}), 409

    user_id = None
    if role == "teacher":
        user_id = users.insert_one(
            {
                "name": name,
                "age": age,
                "role": role,
                "school": schoolName,
                "phone": phone,
            }
        ).inserted_id
    elif role == "parent" or role == "psychologist":
        user_id = users.insert_one(
            {"name": name, "age": age, "role": role, "phone": phone}
        ).inserted_id
    else:
        return jsonify({"error": "Invalid role"}), 400
    token = generate_token(user_id)
    return jsonify({"token": token, "message": "User registered successfully"}), 201


# Login route


@app.route("/login", methods=["POST"])
def login():
    # data = request.get_json()
    # email = data.get("email")
    # password = data.get("password")

    # user = users.find_one({"email": email})
    # if user and bcrypt.checkpw(
    #     password.encode("utf-8"), user["password"].encode("utf-8")
    # ):
    #     token = generate_token(user["_id"])
    #     return (
    #         jsonify(
    #             {"token": token, "message": "Login successful", "role": user["role"]}
    #         ),
    #         200,
    #     )
    # else:
    #     return jsonify({"error": "Invalid email or password"}), 401
    data = request.get_json()
    phone = data.get("phone")

    # Check if the phone number exists in the database
    user = users.find_one({"phone": phone})
    if user:
        # Generate JWT token for the user if phone number exists
        token = generate_token(user["_id"])
        user["_id"] = str(user["_id"])
        response_data = {
            "token": token,
            # Spread the user data into the response
            **user,
        }
        return jsonify(response_data), 200
    else:
        # Return an error message if phone number is not found
        return jsonify({"error": "Invalid phone number"}), 401


# Protected route example


@app.route("/protected", methods=["GET"])
def protected():
    # token = request.headers.get("Authorization")
    # if token and token.startswith("Bearer "):
    #     token = token.split(" ")[1]
    # else:
    #     return jsonify({"error": "Token is missing or invalid format"}), 401

    # try:
    #     payload = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
    #     user_id = payload["user_id"]
    #     user = users.find_one({"_id": ObjectId(user_id)})
    #     return (
    #         jsonify(
    #             {
    #                 "message": "Access granted",
    #                 "email": user["email"],
    #                 "role": user["role"],
    #             }
    #         ),
    #         200,
    #     )
    # except jwt.ExpiredSignatureError:
    #     return jsonify({"error": "Token has expired"}), 401
    # except jwt.InvalidTokenError:
    token = request.headers.get("Authorization")
    if token and token.startswith("Bearer "):
        token = token.split(" ")[1]
    else:
        return jsonify({"error": "Token is missing or invalid format"}), 401

    try:
        payload = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
        user_id = payload["user_id"]
        user = users.find_one({"_id": ObjectId(user_id)})

        if not user:
            return jsonify({"error": "User not found"}), 404

        return (
            jsonify(
                {
                    "message": "Access granted",
                    "phone": user["phone"],
                    "role": user["role"],
                }
            ),
            200,
        )
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401


"""TODO: Show children for parents and all children of the school for the teacher.
"""


############################### Children ########################################################
@app.route("/children/add", methods=["POST"])
def add_child():
    data = request.get_json()
    name = data.get("name")
    age = data.get("age")
    parent_id = data.get("parent_id")
    school = data.get("school")
    # Check if child data already exists
    if children.find_one({"name": name, "age": age, "parent_id": ObjectId(parent_id)}):
        return jsonify({"error": "Child already exists"}), 409
    child_data = {
        "Name": name,
        "Age": int(age),
        "ParentId": ObjectId(parent_id),
        "School": school,
    }
    child_id = children.insert_one(child_data).inserted_id
    return jsonify({"message": "Child added", "id": str(child_id)}), 201


# lists down the children for both parent dashboard and teacher dashboard
@app.route("/children", methods=["GET"])
@cross_origin(origin="http://localhost:3000", supports_credentials=True)
def get_children():
    # send user_type, parent_id(user_id), school
    # data=request.get_json()
    user_type = request.args.get("user_type")
    user_type = user_type.lower()
    print("l284 app.py data = ", user_type)
    print("length of user type = ", len(user_type))

    if user_type == "parent" or user_type == "child":
        parent_id = request.args.get("parent_id")
        children_list = list(children.find({"ParentId": ObjectId(parent_id)}))
        for child in children_list:
            child["_id"] = str(child["_id"])
            child["ParentId"] = str(child["ParentId"])

        print("l295 app.py: ")
        print(children_list)
        return jsonify(children_list), 200
    elif user_type == "teacher":
        school = request.args.get("school")
        print("l302 school = ", school)
        children_list = list(children.find({"School": school}))
        for child in children_list:
            child["_id"] = str(child["_id"])
            child["ParentId"] = str(child["ParentId"])

        print("l303 app.py: ")
        print(children_list)
        return jsonify(children_list), 200
    else:
        return jsonify({"error": "Invalid user type"}), 400


# Route for serving images
@app.route("/images/<filename>")
def serve_image(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


# Note that these routes use multipart/form-data instead of application/json


@app.route("/questions", methods=["POST"])
def create_question():
    data = request.form
    question_text = data.get("question_text")
    question_type = data.get("type")
    tags = data.getlist("tags")
    questionnaire_id = data.get("questionnaire_id")
    tag = data.get("question_tag")

    # Prepare the question document
    question_data = {
        "questionnaire_id": ObjectId(questionnaire_id),
        "question_text": question_text,
        "type": question_type,
        "tags": tag,
        "created_at": datetime.datetime.utcnow(),
        "updated_at": datetime.datetime.utcnow(),
    }

    # Handle question image if provided
    if "question_image" in request.files:
        question_image = request.files["question_image"]
        question_image_filename = f"{datetime.datetime.utcnow().timestamp()}-ques.jpg"
        question_image_path = os.path.join(
            app.config["UPLOAD_FOLDER"], question_image_filename
        )
        question_image.save(question_image_path)
        # Add image filename to question data
        question_data["question_image"] = question_image_filename

    # Insert the question data into MongoDB to get the question_id
    question_id = questions.insert_one(question_data).inserted_id

    # Process options
    options = []
    option_index = 0
    while (
        f"option_text_{option_index}" in data
        or f"option_image_{option_index}" in request.files
    ):
        option = {"text": data.get(f"option_text_{option_index}"), "image": None}

        # Save option image if provided
        if f"option_image_{option_index}" in request.files:
            option_image = request.files[f"option_image_{option_index}"]
            option_image_filename = f"{question_id}-option_{option_index}.jpg"
            option_image_path = os.path.join(
                app.config["UPLOAD_FOLDER"], option_image_filename
            )
            option_image.save(option_image_path)
            option["image"] = option_image_filename

        options.append(option)
        option_index += 1

    # Update the question with options in the database
    questions.update_one({"_id": ObjectId(question_id)}, {"$set": {"options": options}})

    # Add question to the questionnaire's question list
    db["questionnaire"].update_one(
        {"_id": ObjectId(questionnaire_id)}, {"$push": {"questions": question_id}}
    )

    return jsonify({"message": "Question created", "id": str(question_id)}), 201


@app.route("/questions", methods=["GET"])
def view_questions():
    question_list = list(
        questions.find(
            {}, {"_id": 1, "question_text": 1, "type": 1, "tags": 1, "options": 1}
        )
    )
    for question in question_list:
        question["_id"] = str(question["_id"])

        # Include question image URL
        question_image_filename = f"{question['_id']}-ques.jpg"
        question["question_image"] = (
            f"/images/{question_image_filename}"
            if os.path.exists(
                os.path.join(app.config["UPLOAD_FOLDER"], question_image_filename)
            )
            else None
        )

        # Include image URLs for each option
        for i, option in enumerate(question.get("options", [])):
            if option.get("image"):
                option_image_filename = f"{question['_id']}-option_{i}.jpg"
                option["image"] = (
                    f"/images/{option_image_filename}"
                    if os.path.exists(
                        os.path.join(app.config["UPLOAD_FOLDER"], option_image_filename)
                    )
                    else None
                )

    return jsonify(question_list), 200


@app.route("/questions/<question_id>", methods=["PUT"])
def update_question(question_id):
    data = request.form
    update_fields = {}

    if "question_text" in data:
        update_fields["question_text"] = data["question_text"]
    if "type" in data:
        update_fields["type"] = data["type"]
    if "tags" in data:
        update_fields["tags"] = data.getlist("tags")

    # Update existing text data in MongoDB
    update_fields["updated_at"] = datetime.datetime.utcnow()
    questions.update_one({"_id": ObjectId(question_id)}, {"$set": update_fields})

    # Handle question image replacement
    if "question_image" in request.files:
        question_image = request.files["question_image"]
        question_image_filename = f"{question_id}-ques.jpg"
        question_image_path = os.path.join(
            app.config["UPLOAD_FOLDER"], question_image_filename
        )
        question_image.save(question_image_path)

    # Update options dynamically
    options = []
    option_index = 0
    while (
        f"option_text_{option_index}" in data
        or f"option_image_{option_index}" in request.files
    ):
        option = {"text": data.get(f"option_text_{option_index}"), "image": None}

        # Replace option image if provided
        if f"option_image_{option_index}" in request.files:
            option_image = request.files[f"option_image_{option_index}"]
            option_image_filename = f"{question_id}-option_{option_index}.jpg"
            option_image_path = os.path.join(
                app.config["UPLOAD_FOLDER"], option_image_filename
            )
            option_image.save(option_image_path)
            option["image"] = option_image_filename

        options.append(option)
        option_index += 1

    # Update options in the database
    questions.update_one({"_id": ObjectId(question_id)}, {"$set": {"options": options}})
    return jsonify({"message": "Question updated"}), 200


@app.route("/questions/<question_id>", methods=["DELETE"])
def delete_question(question_id):
    question = questions.find_one({"_id": ObjectId(question_id)})
    if not question:
        return jsonify({"error": "Question not found"}), 404

    # Delete question image
    question_image_filename = f"{question_id}-ques.jpg"
    question_image_path = os.path.join(
        app.config["UPLOAD_FOLDER"], question_image_filename
    )
    if os.path.exists(question_image_path):
        os.remove(question_image_path)

    # Delete each option image if it exists
    for i, option in enumerate(question.get("options", [])):
        if option.get("image"):
            option_image_filename = f"{question_id}-option_{i}.jpg"
            option_image_path = os.path.join(
                app.config["UPLOAD_FOLDER"], option_image_filename
            )
            if os.path.exists(option_image_path):
                os.remove(option_image_path)

    # Delete the question from MongoDB
    questions.delete_one({"_id": ObjectId(question_id)})
    return jsonify({"message": "Question deleted"}), 200


@app.route("/questionnaire", methods=["OPTIONS"])
def handle_preflight():
    response = jsonify({"message": "OK"})
    response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "POST,OPTIONS")
    response.headers.add("Access-Control-Allow-Credentials", "true")
    return response


# Updated view_questionnaire route to include questions
@app.route("/view_questionnaire", methods=["GET"])
@cross_origin(origin="http://localhost:3000", supports_credentials=True)
def view_questionnaire():
    question_list = list(
        questionnaire.find(
            {}, {"_id": 1, "name": 1, "author": 1, "created_at": 1, "updated_at": 1}
        )
    )
    for question in question_list:
        question["_id"] = str(question["_id"])

    return jsonify(question_list), 200


# Updated create_questionnaire route


@app.route("/questionnaire", methods=["POST"])
@cross_origin(origin="http://localhost:3000", supports_credentials=True)
def create_questionnaire():
    data = request.form
    questionnaire_name = data["name"]
    author = data["author"]

    questionnaire_id = questionnaire.insert_one(
        {
            "name": questionnaire_name,
            "author": author,
            "created_at": datetime.datetime.utcnow(),
            "updated_at": datetime.datetime.utcnow(),
            "questions": [],  # Initialize empty questions array
        }
    ).inserted_id

    return (
        jsonify({"message": "Questionnaire created", "id": str(questionnaire_id)}),
        201,
    )


@app.route("/questionnaire/<questionnaire_id>/view", methods=["GET"])
@cross_origin(origin="http://localhost:3000", supports_credentials=True)
def get_questionnaire_dets(questionnaire_id):
    curr_questionnaire = questionnaire.find_one(
        {"_id": ObjectId(questionnaire_id)}, {"name": 1}  # Only fetch the author field
    )

    return jsonify({"name": curr_questionnaire.get("name")}), 200


app.route("/delete_questionnaire", methods=["DELETE"])


def delete_questionnaire():
    try:
        # Get questionnaire ID from request body
        data = request.get_json()
        questionnaire_id = data.get("id")

        if not questionnaire_id:
            return jsonify({"error": "Questionnaire ID is required"}), 400

        # If using MongoDB
        result = questionnaire.delete_one({"_id": ObjectId(questionnaire_id)})

        if result.deleted_count == 0:
            return jsonify({"error": "Questionnaire not found"}), 404

        return (
            jsonify(
                {
                    "message": "Questionnaire deleted successfully",
                    "id": questionnaire_id,
                }
            ),
            200,
        )

    except Exception as e:
        print(f"Error deleting questionnaire: {str(e)}")
        return jsonify({"error": "Failed to delete questionnaire"}), 500


@app.route("/questionnaire/<questionnaire_id>/tags", methods=["GET"])
def get_tags(questionnaire_id):
    try:
        curr_questionnaire = questionnaire.find_one({"_id": ObjectId(questionnaire_id)})
        if curr_questionnaire is None:
            return jsonify({"error": "Questionnaire not found"}), 404
        return jsonify({"tags": curr_questionnaire.get("tags", [])}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/update_questionnaire", methods=["PUT"])
def update_questionnaire():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        questionnaire_id = data.get("id")
        name = data.get("name")
        author = data.get("author")
        category = data.get("category")
        if not all([questionnaire_id, name, author]):
            return jsonify({"error": "ID, name, and author are required"}), 400
        updated_questionnaire = questionnaire.find_one_and_update(
            {"_id": ObjectId(questionnaire_id)},
            {"$set": {"name": name, "author": author, "category": category}},
            return_document=True,
        )

        if not updated_questionnaire:
            return jsonify({"error": "Questionnaire not found"}), 404
        updated_questionnaire["_id"] = str(updated_questionnaire["_id"])
        return jsonify({"message": "Updated"}), 200

    except Exception as e:
        print(f"Error updating questionnaire: {str(e)}")
        return jsonify({"error": "Failed to update questionnaire"}), 500


# Function to convert ObjectId and datetime objects to strings


def make_json_serializable(data):
    data = [item for item in data if item is not None]
    for item in data:
        if "_id" in item:
            item["_id"] = str(item["_id"])
        if "questionnaire_id" in item:
            item["questionnaire_id"] = str(item["questionnaire_id"])
        if "created_at" in item:
            item["created_at"] = item["created_at"].isoformat()
        if "updated_at" in item:
            item["updated_at"] = item["updated_at"].isoformat()
    return data


# Get questions for a specific questionnaire
@app.route("/questionnaire/<questionnaire_id>/questions", methods=["GET"])
@cross_origin(origin="http://localhost:3000", supports_credentials=True)
def get_questionnaire_questions(questionnaire_id):
    print("hello world")
    try:
        questionnaire_object=questionnaire.find_one({"_id": ObjectId(questionnaire_id)})
        question_list = []
        for question_id in questionnaire_object["questions"]:
            question = questions.find_one({"_id": question_id})
            question_list.append(question)
        question_list = make_json_serializable(question_list)
        for question in question_list:
            question["_id"] = str(question["_id"])

            # Include question image URL
            question_image_filename = f"{question['_id']}-ques.jpg"
            question["question_image"] = (
                f"/images/{question_image_filename}"
                if os.path.exists(
                    os.path.join(app.config["UPLOAD_FOLDER"], question_image_filename)
                )
                else None
            )

            # Include image URLs for each option
            for i, option in enumerate(question.get("options", [])):
                if option.get("image"):
                    option_image_filename = f"{question['_id']}-option_{i}.jpg"
                    option["image"] = (
                        f"/images/{option_image_filename}"
                        if os.path.exists(
                            os.path.join(
                                app.config["UPLOAD_FOLDER"], option_image_filename
                            )
                        )
                        else None
                    )
        

        return jsonify(question_list), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/set_active_questionnaire/<questionnaire_id>", methods=["POST"])
@cross_origin(origin="http://localhost:3000", supports_credentials=True)
def set_active_questionnaire(questionnaire_id):
    try:
        # First, set all questionnaires' active status to False
        questionnaire.update_many(
            {}, {"$set": {"active": False}}  # Empty filter means all documents
        )

        # Then set the selected questionnaire's active status to True
        result = questionnaire.update_one(
            {"_id": ObjectId(questionnaire_id)}, {"$set": {"active": True}}
        )

        if result.modified_count > 0:
            return (
                jsonify(
                    {
                        "status": "success",
                        "message": "Active questionnaire updated successfully",
                    }
                ),
                200,
            )
        else:
            return (
                jsonify({"status": "error", "message": "Questionnaire not found"}),
                404,
            )

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# returns the questionnaire id
@app.route("/questionnaire/active", methods=["GET"])
@cross_origin(origin="http://localhost:3000", supports_credentials=True)
def get_active_questionnaire():
    user_type = request.args.get("user_type")
    active_questionnaire = active.find_one({"type": user_type})
    if active_questionnaire:
        questionnaire_id = active_questionnaire.get("questionnaireId")
        return jsonify({"questionnaire_id": questionnaire_id}), 200
    else:
        return jsonify({"error": "No active questionnaire found"}), 404


############################################################ Responses###############################################################################
@app.route("/responses", methods=["POST"])
def create_response():
    # Get ResponseCount from counters.json
    with open("./counters.json", "r+") as json_file:
        counters = json.load(json_file)
        response_count = counters["ResponseCount"]
        counters["ResponseCount"] = response_count + 1

        # Write back updated counter in same file handle
        json_file.seek(0)
        json.dump(counters, json_file)
        json_file.truncate()

    # Process the response data
    data = request.get_json()
    response_doc = {
        "user_id": ObjectId(data["user_id"]),
        "user_type": data["user_type"],
        "child_id": ObjectId(data["child_id"]),
        "questionnaire_id": ObjectId(data["questionnaire_id"]),
        "answers": [
            {"question_id": ObjectId(ans["question_id"]), "answer": ans["answer"]}
            for ans in data["answers"]
        ],
        "created_at": datetime.datetime.utcnow(),
        "response_number": response_count,
    }

    response_id = responses.insert_one(response_doc).inserted_id

    return jsonify({"message": "Response created", "id": str(response_id)}), 201


@app.route("/responses/<response_id>", methods=["GET"])
def get_response(response_id):
    response = responses.find_one({"_id": ObjectId(response_id)})
    if response:
        response["_id"] = str(response["_id"])
        response["user_id"] = str(response["user_id"])
        response["child_id"] = (
            str(response["child_id"]) if response.get("child_id") else None
        )
        response["questionnaire_id"] = str(response["questionnaire_id"])
        response["answers"] = [
            {"question_id": str(ans["question_id"]), "answer": ans["answer"]}
            for ans in response["answers"]
        ]
        return jsonify(response), 200
    return jsonify({"message": "Response not found"}), 404


@app.route("/responses", methods=["GET"])
def get_responses():
    # Get query parameters
    user_id = request.args.get("user_id")
    questionnaire_id = request.args.get("questionnaire_id")
    child_id = request.args.get("child_id")

    # Build query filter
    query = {}
    if user_id:
        query["user_id"] = ObjectId(user_id)
    if questionnaire_id:
        query["questionnaire_id"] = ObjectId(questionnaire_id)
    if child_id:
        query["child_id"] = ObjectId(child_id)

    # Get responses
    cursor = responses.find(query)
    response_list = []

    for response in cursor:
        response["_id"] = str(response["_id"])
        response["user_id"] = str(response["user_id"])
        response["child_id"] = (
            str(response["child_id"]) if response.get("child_id") else None
        )
        response["questionnaire_id"] = str(response["questionnaire_id"])
        response["answers"] = [
            {"question_id": str(ans["question_id"]), "answer": ans["answer"]}
            for ans in response["answers"]
        ]
        response_list.append(response)

    return jsonify(response_list), 200


@app.route("/responses/<response_id>", methods=["PUT"])
def update_response(response_id):
    data = request.get_json()

    # Update only allowed fields
    update_data = {
        "answers": [
            {"question_id": ObjectId(ans["question_id"]), "answer": ans["answer"]}
            for ans in data["answers"]
        ],
        "updated_at": datetime.datetime.utcnow(),
    }

    result = responses.update_one({"_id": ObjectId(response_id)}, {"$set": update_data})

    if result.modified_count:
        return jsonify({"message": "Response updated"}), 200
    return jsonify({"message": "Response not found"}), 404


@app.route("/responses/<response_id>", methods=["DELETE"])
def delete_response(response_id):
    result = responses.delete_one({"_id": ObjectId(response_id)})

    if result.deleted_count:
        return jsonify({"message": "Response deleted"}), 200
    return jsonify({"message": "Response not found"}), 404


# Route to get Summary from Diagnosis
@app.route("/summary_from_diagnosis", methods=["GET"])
def get_summary_from_diagnosis():
    #
    # Expected query parameters:
    # diagnosis: str
    # child_age: int
    #
    # Output:
    # json object with summary key
    # {"summary": str}
    #

    diagnosis_map_db = client["diagnosis_to_summary"]

    diagnosis = request.args.get("diagnosis")
    age = int(request.args.get("child_age"))

    print(f"DEBUG: Diagnosis: {diagnosis}, Age: {age}")

    if 2 <= age <= 5:
        req_collection_name = "2-5 years"
    elif 5 < age <= 11:
        req_collection_name = "5-18 years"
    elif 11 <= age <= 18:
        req_collection_name = "CHILDREN 11-18"
    else:
        return jsonify({"error": "Age is out of valid range"}), 400

    try:
        collection = diagnosis_map_db[req_collection_name]

        query = {
            "diagnosis": {
                "$regex": f"^{diagnosis}$",  # Matches the exact string (case-insensitive)
                "$options": "i",  # 'i' makes it case-insensitive
            }
        }

        print(f"DEBUG: Querying MongoDB with: {query}")
        result = collection.find_one(query)

        if result:
            # Initialize summary_data as an empty string
            summary_data = ""

            # Extract and concatenate fields dynamically based on the collection
            if req_collection_name == "2-5 years":
                fields = [
                    "findings 1",
                    "findings 2",
                    "impressions 1",
                    "impressions 2",
                    "disclaimer",
                ]
            elif req_collection_name == "5-18 years":
                fields = [
                    "findings 1",
                    "findings 2",
                    "findings 3",
                    "impressions 1",
                    "impressions 2",
                    "impressions 3",
                    "disclaimer",
                ]
            elif req_collection_name == "CHILDREN 11-18":
                fields = ["findings 1", "impressions 1", "impressions 2", "disclaimer"]
            else:
                fields = []

            # Concatenate values for the specified fields
            summary_data = " ".join(
                filter(None, (result.get(field, "") for field in fields))
            )

            # Return the formatted data to the frontend
            return jsonify({"summary": summary_data}), 200
        else:
            return jsonify({"error": "Diagnosis not found"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500


def fetch_diagnosis_from_results(
    age, parent_filled, teacher_filled, fields, diagnosis_db
):
    """
    Get a diagnosis based on the provided parameters.

    Args:
    - age (int): Age of the child.
    - parent_filled (bool): Whether the parent filled the form.
    - teacher_filled (bool): Whether the teacher filled the form.
    - fields (dict): A dictionary of diagnostic results.

    Returns:
    - dict: The diagnosis result or an error message.
    """
    # print(f"age : {age}")
    # print(parent_filled)
    # print(teacher_filled)

    if not parent_filled and not teacher_filled:
        return {"error": "Neither Parent nor Teacher Filled"}, 404

    if 2 <= age <= 5:
        if parent_filled and teacher_filled:
            req_collection_name = "2-5 years"
        elif parent_filled and not teacher_filled:
            req_collection_name = "2-5 years Parent"
        elif not parent_filled and teacher_filled:
            req_collection_name = "2-5 years Teacher"
    elif 5 < age <= 11:
        if parent_filled and teacher_filled:
            req_collection_name = "5-11 years"
        elif parent_filled and not teacher_filled:
            req_collection_name = "5-11 years Parent"
        elif not parent_filled and teacher_filled:
            req_collection_name = "5-11 years Teacher"
    else:
        return {"error": "Age is out of valid range"}, 400

    try:
        collection = db["result_to_diagnosis"]
        print(collection)
        print(fields.items())

        query = {
            key: value for key, value in fields.items() if key != "REPORT TO BE SENT"
        }

        result = collection.find_one(query)
        print(result)

        if result:
            diagnosis = result.get("REPORT TO BE SENT")
            if diagnosis:
                return {"diagnosis": diagnosis}, 200
        return {"error": "Diagnosis not found"}, 404
    except Exception as e:
        print("hello")
        return {"error": str(e)}, 500


@app.route("/diagnosis_from_results", methods=["GET"])
def get_diagnosis_from_results():
    """
    Flask route to get a diagnosis based on the provided parameters.

    Expected query parameters:
    - child_age: int
    - parent_filled: bool
    - teacher_filled: bool

    Output:
    - json object with diagnosis key
    {"diagnosis": str}
    """

    diagnosis_db = client["result_to_diagnosis"]

    age = int(request.args.get("child_age"))
    parent_filled = request.args.get("parent_filled").lower() == "true"
    teacher_filled = request.args.get("teacher_filled").lower() == "true"
    fields = request.get_json()

    try:
        # Call the base function
        result, status_code = fetch_diagnosis_from_results(
            age, parent_filled, teacher_filled, fields, diagnosis_db
        )

        # Return the result as a JSON response
        return jsonify(result), status_code

    except ValueError:
        return jsonify({"error": "Invalid age parameter"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Route to get Child Data, Diagnosis and Summary from Response ID
# @app.route("/summary_from_diagnosis", methods=["GET"])
@app.route("/questionnaire/<questionnaire_id>/tag/<tag>/rubric", methods=["POST"])
@cross_origin(supports_credentials=True)
def save_rubric(questionnaire_id, tag):

    try:
        # Decode the URL-encoded tag
        decoded_tag = unquote(tag)
        decoded_tag = decoded_tag.replace(".", "_").replace("$", "_")

        # Get the rubric code from request body
        data = request.get_json()
        if not data or "rubric" not in data:
            return jsonify({"error": "No rubric code provided"}), 400

        rubric_code = data["rubric"]
        # print(f"Decoded tag {rubric_code}")
        # Basic validation of the Python code
        try:
            ast.parse(rubric_code)
        except SyntaxError as e:
            return jsonify({"error": "Invalid Python syntax", "details": str(e)}), 400

        # Validate questionnaire exists
        curr_questionnaire = questionnaire.find_one({"_id": ObjectId(questionnaire_id)})
        if not curr_questionnaire:
            return jsonify({"error": "Questionnaire not found"}), 404

        # Update or insert the rubric for the tag
        # print(rubrics)
        result = rubrics.update_one(
            {"questionnaire_id": ObjectId(questionnaire_id), "tag": decoded_tag},
            {
                "$set": {"code": rubric_code},
            },
            upsert=True,
        )
        # print("here")

        return (
            jsonify(
                {
                    "message": "Rubric saved successfully",
                    "modified": result.modified_count > 0,
                    "upserted": result.upserted_id is not None,
                }
            ),
            200,
        )

    except Exception as e:
        # print(f"Error saving rubric: {traceback.format_exc()}")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500


@app.route("/question_by_tag", methods=["POST"])
def get_questions_by_tag():
    try:
        data = request.get_json()
        questionnaire_id = data.get("questionnaire_id")
        tag = data.get("tag")
        ql = []
        if not questionnaire_id or not tag:
            return (
                jsonify({"error": "Missing questionnaire_id or tag in the request"}),
                400,
            )
        ques1 = list(
            questions.find(
                {"questionnaire_id": ObjectId(questionnaire_id), "tags": tag}
            )
        )
        if len(ques1) == 0:
            return jsonify({"message": f"No questions found for tag '{tag}'"}), 404
        print(ques1[0])
        for question in ques1:
            question["_id"] = str(question["_id"])
            ques = {}
            ques["question_text"] = question["question_text"]
            ques["type"] = question["type"]
            ques["_id"] = question["_id"]
            ques["tags"] = question["tags"]
            ql.append(ques)

        return jsonify({"questions": ql})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Below is commented way of how to run a function that is taken from textbox , will be useful in pipeline
# func_string = """
# def my_function(x):
#     print(x * 2)
#     return x * 2
# """


# run_function(func_string, 5)


def fetch_results_from_responses(fields_json):
    """
    Function to fetch results from responses.

    Args:
    - fields_json (dict): The JSON object containing the fields.

    Returns:
    - dict: The results from the responses.
    - parent_filled (bool): Whether the parent filled the form.
    - teacher_filled (bool): Whether the teacher filled the form.
    """
    import random
    
    responses = fields_json["responses"]
    question_ids = [ObjectId(resp["question_id"]) for resp in responses]

    # First get all questions with their tags and questionnaire_id
    all_questions = questions.find(
        {"_id": {"$in": question_ids}}, {"_id": 1, "tags": 1, "questionnaire_id": 1}
    )

    # Get questionnaire_id from the first question
    first_question = all_questions[0]
    questionnaire_id = first_question.get("questionnaire_id")

    question_tag_map = {
        str(question["_id"]): (
            question["tags"][0] if question.get("tags") else "Untagged"
        )
        for question in all_questions
    }

    # Group responses by tags
    responses_grouped = {}

    for response in responses:
        question_id = response["question_id"]
        tag = question_tag_map.get(question_id, "Untagged")

        if tag not in responses_grouped:
            responses_grouped[tag] = []

        responses_grouped[tag].append(
            {"question_id": question_id, "answer": response["answer"]}
        )

    # Get rubric codes and process responses
    # tag_results = {}

    # for tag, responses_list in responses_grouped.items():
    #     # Get rubric code for this tag
    #     rubric = rubrics.find_one(
    #         {"questionnaire_id": questionnaire_id, "tag": tag}, {"code": 1}
    #     )

    #     if rubric and rubric.get("code"):
    #         # Extract just the answers from responses
    #         answers = [resp["answer"] for resp in responses_list]

    #         # print(rubric["code"])
    #         def run_function(func_string, funcinput, funcname="my_function"):
    #             # Execute the function definition in the current global scope
    #             exec(func_string, globals())

    #             # Retrieve the function from globals and call it
    #             if funcname in globals():
    #                 func = globals()[funcname]  # Get the function by name
    #                 result = func(funcinput)  # Call the function with input
    #                 return result
    #             else:
    #                 return f"Function '{funcname}' not found."

    #         # Run the rubric code with the answers
    #         try:
    #             result = run_function(
    #                 func_string=rubric["code"],
    #                 funcinput=answers,
    #                 funcname="grade_answer",
    #             )
    #             tag_results[tag] = result
    #         except Exception as e:
    #             tag_results[tag] = f"Error processing {tag}: {str(e)}"

    # Temporary hard code
    tag_results = [
        [
            # AGE APPROPRIATE
            {
                "EPS P": "NORMAL",
                "CPS P": "NORMAL",
                "HS P": "NORMAL",
                "PPS P": "NORMAL",
                "ProS P": "NORMAL",
                "TDS P": "HIGH",
                "EPS T": "NORMAL",
                "CPS T": "NORMAL",
                "HS T": "NORMAL",
                "PPS T": "NORMAL",
                "ProS T": "NORMAL",
                "TDS T": "NORMAL",
                "ID P": "HIGH",
                "ID T": "NORMAL",
                "AUT P": "NORMAL",
                "AUT T": "NORMAL",
            },
            True,
            True,
            4,
        ],
        [
            # AGE APPROPRIATE
            {
                "EPS P": "NORMAL",
                "CPS P": "NORMAL",
                "HS P": "NORMAL",
                "PPS P": "NORMAL",
                "ProS P": "NORMAL",
                "TDS P": "NORMAL",
                "EPS T": "NORMAL",
                "CPS T": "NORMAL",
                "HS T": "NORMAL",
                "PPS T": "NORMAL",
                "ProS T": "NORMAL",
                "TDS T": "HIGH",
                "ID P": "NORMAL",
                "ID T": "NORMAL",
                "AUT P": "NORMAL",
                "AUT T": "NORMAL",
                "LD LANG": "NORMAL",
                "LD MATH": "NORMAL",
                "LD BEH": "NORMAL",
                "LD MS": "NORMAL",
            },
            True,
            True,
            8,
        ],
        [
            # INTELLECTUAL DISABILITY
            {
                "EPS P": "NORMAL",
                "CPS P": "NORMAL",
                "HS P": "NORMAL",
                "PPS P": "NORMAL",
                "ProS P": "NORMAL",
                "TDS P": "NORMAL",
                "EPS T": "NORMAL",
                "CPS T": "NORMAL",
                "HS T": "NORMAL",
                "PPS T": "NORMAL",
                "ProS T": "NORMAL",
                "TDS T": "NORMAL",
                "ID P": "HIGH",
                "ID T": "NORMAL",
                "AUT P": "NORMAL",
                "AUT T": "NORMAL",
            },
            True,
            True,
            3,
        ],
        [
            # L
            {
                "EPS P": "NORMAL",
                "CPS P": "NORMAL",
                "HS P": "NORMAL",
                "PPS P": "NORMAL",
                "ProS P": "NORMAL",
                "TDS P": "NORMAL",
                "EPS T": "NORMAL",
                "CPS T": "NORMAL",
                "HS T": "NORMAL",
                "PPS T": "NORMAL",
                "ProS T": "NORMAL",
                "TDS T": "NORMAL",
                "ID P": "NORMAL",
                "ID T": "NORMAL",
                "AUT P": "NORMAL",
                "AUT T": "NORMAL",
                "LD LANG": "HIGH",
                "LD MATH": "NORMAL",
                "LD BEH": "NORMAL",
                "LD MS": "NORMAL",
            },
            True,
            True,
            10,
        ],
    ]
    
    r_int = random.randint(0, 100)
    
    if r_int < 10:
        return tag_results[0][0], tag_results[0][1], tag_results[0][2], random.randint(2, 4)
    elif r_int < 20:
        return tag_results[1][0], tag_results[1][1], tag_results[1][2], random.randint(6, 10)
    # elif r_int < 60:
    else:
        return tag_results[2][0], tag_results[2][1], tag_results[2][2], random.randint(2, 4)
        # return tag_results[3][0], tag_results[3][1], tag_results[3][2], random.randint(6, 10)


@app.route("/results_from_responses", methods=["GET"])
def results_from_reponses():
    fields = request.get_json()
    responses = fields["responses"]
    question_ids = [ObjectId(resp["question_id"]) for resp in responses]

    # First get all questions with their tags and questionnaire_id
    all_questions = questions.find(
        {"_id": {"$in": question_ids}}, {"_id": 1, "tags": 1, "questionnaire_id": 1}
    )

    # Get questionnaire_id from the first question
    first_question = all_questions[0]
    questionnaire_id = first_question.get("questionnaire_id")

    question_tag_map = {
        str(question["_id"]): (
            question["tags"][0] if question.get("tags") else "Untagged"
        )
        for question in all_questions
    }

    # Group responses by tags
    responses_grouped = {}

    for response in responses:
        question_id = response["question_id"]
        tag = question_tag_map.get(question_id, "Untagged")

        if tag not in responses_grouped:
            responses_grouped[tag] = []

        responses_grouped[tag].append(
            {"question_id": question_id, "answer": response["answer"]}
        )

    # Get rubric codes and process responses
    tag_results = {}

    for tag, responses_list in responses_grouped.items():
        # Get rubric code for this tag
        rubric = rubrics.find_one(
            {"questionnaire_id": questionnaire_id, "tag": tag}, {"code": 1}
        )

        if rubric and rubric.get("code"):
            # Extract just the answers from responses
            answers = [resp["answer"] for resp in responses_list]

            # print(rubric["code"])
            def run_function(func_string, funcinput, funcname="my_function"):
                # Execute the function definition in the current global scope
                exec(func_string, globals())

                # Retrieve the function from globals and call it
                if funcname in globals():
                    func = globals()[funcname]  # Get the function by name
                    result = func(funcinput)  # Call the function with input
                    return result
                else:
                    return f"Function '{funcname}' not found."

            # Run the rubric code with the answers
            try:
                result = run_function(
                    func_string=rubric["code"],
                    funcinput=answers,
                    funcname="grade_answer",
                )
                tag_results[tag] = result
            except Exception as e:
                tag_results[tag] = f"Error processing {tag}: {str(e)}"

    return jsonify(tag_results), 200


def fetch_children_from_school(school_name, children_collection):
    """
    Helper function to fetch all children from a specified school.

    Args:
    - school_name (str): The name of the school.
    - children_collection: The MongoDB collection to query.

    Returns:
    - A list of child IDs if found, or an empty list if no children are found.
    """
    try:
        # Query MongoDB collection
        results = children_collection.find({"School": school_name})

        # print(results)

        # # Convert MongoDB cursor to a list, and ensure _id is properly handled
        children_list = []
        for child in results:
            child["_id"] = str(child["_id"])  # Convert ObjectId to string
            # print(child)
            children_list.append(child["_id"])

        return children_list

    except Exception as e:
        print(f"Error fetching children from school '{school_name}': {e}")
        raise e


@app.route("/get_all_children_from_school_name", methods=["GET"])
def get_all_children_from_school_name():
    """
    Flask route to fetch all children from a specified school.

    Expected query parameter:
    - school_name: str

    Returns:
    - A JSON list of child IDs if found, otherwise an error message.
    """

    school_name = request.args.get("school_name")

    if not school_name:
        return jsonify({"error": "school_name parameter is required"}), 400

    try:
        children_list = fetch_children_from_school(school_name, children)

        if not children_list:
            return (
                jsonify({"message": "No children found for the specified school"}),
                404,
            )

        return jsonify({"children": children_list}), 200

    except Exception as e:
        return jsonify({"error": "An error occurred while fetching children"}), 500


def fetch_rid_from_child(child_id, responses_collection):
    """
    Fetch the `r_id` associated with a child from the `responses` collection.

    Args:
    - child_id (str): The ID of the child (expected to be a valid ObjectId string).
    - responses_collection: The MongoDB collection to query.

    Returns:
    - str: The `r_id` if found, otherwise None.
    """
    try:
        # Validate the child_id as a valid ObjectId
        if not ObjectId.is_valid(child_id):
            print(f"[FETCH RID] Invalid ObjectId: {child_id}")
            raise ValueError(f"Invalid ObjectId: {child_id}")

        # Query the `responses` collection
        result = responses_collection.find_one({"child_id": ObjectId(child_id)})

        print(f"[FETCH RID] Result: {result}")

        # Extract and return the `r_id` if it exists
        if result:
            return result["_id"]

        print(f"[FETCH RID] No r_id found for child '{child_id}'")
        return None

    except Exception as e:
        raise RuntimeError(f"Error fetching r_id for child '{child_id}': {e}")


@app.route("/get_rid_from_child", methods=["GET"])
def get_rid_from_child():
    """
    Flask route to fetch the `r_id` associated with a child from the `responses` collection.

    Expected query parameter:
        child_id (str): The ID of the child (expected to be a valid ObjectId string).

    Returns:
        JSON: The `r_id` if found, otherwise an error message.
    """
    child_id = request.args.get("child_id")

    if not child_id:
        return jsonify({"error": "child_id parameter is required"}), 400

    try:
        # Call the service function
        r_id = fetch_rid_from_child(child_id, responses)
        if r_id is not None:
            return jsonify({"r_id": r_id}), 200
        else:
            return jsonify({"message": "No r_id found for the specified child"}), 404
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 500


# Functions needed:
# get all children from a given school => Done
# get r_id from a given child => Done
# get results from a given r_id => WIP
# get diagnosis from results => Done
# get diagnosis for a rid => Just a wrapper for above 3 functions
# get child_data, summary and diagnosis from response_id


@app.route("/add_tag", methods=["POST"])
def add_tag():
    try:
        data = request.get_json()
        tag = data.get("tag")
        questionnaire_id = data.get("id")
        if not tag:
            return jsonify({"error": "Tag cannot be empty"}), 400

        questionn = questionnaire.find_one({"_id": ObjectId(questionnaire_id)})
        if not questionn:
            return jsonify({"error": "Questionnaire not found"}), 404

        questionnaire.update_one(
            {"_id": ObjectId(questionnaire_id)}, {"$addToSet": {"tags": tag}}
        )

        return jsonify({"message": "Tag added successfully"}), 200

    except Exception as e:
        print(f"Error adding tag: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/set_questionnaire_type", methods=["POST"])
def set_questionnaire_type():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        questionnaire_id = data.get("questionnaireId")
        questionnaire_type = data.get("type")

        if not questionnaire_id:
            return jsonify({"error": "questionnaireId is required"}), 400
        if not questionnaire_type:
            return jsonify({"error": "type is required"}), 400

        valid_types = ["child", "parent", "teacher"]
        if questionnaire_type not in valid_types:
            return (
                jsonify(
                    {
                        "error": f"Invalid questionnaire type. Must be one of: {', '.join(valid_types)}"
                    }
                ),
                400,
            )

        try:
            filter_query = {"type": questionnaire_type}
            update_query = {
                "$set": {
                    "questionnaireId": questionnaire_id,
                    "type": questionnaire_type,
                }
            }

            # Common logic for all questionnaire types
            existing_document = active.find_one(filter_query)

            if existing_document:
                # Update the existing document
                active.update_one(filter_query, update_query)
                message = f"{questionnaire_type.capitalize()} questionnaire updated successfully"
            else:
                # Insert a new document for the type
                new_document = {
                    "questionnaireId": questionnaire_id,
                    "type": questionnaire_type,
                }
                active.insert_one(new_document)
                message = f"{questionnaire_type.capitalize()} questionnaire inserted successfully"

            print(f"{message} - ID: {questionnaire_id}")

            return (
                jsonify(
                    {
                        "message": message,
                        "questionnaireId": questionnaire_id,
                        "type": questionnaire_type,
                    }
                ),
                200,
            )

        except Exception as db_error:
            print(f"Database error: {db_error}")
            return jsonify({"error": "Database update failed"}), 500

    except Exception as e:
        print(f"Error processing request: {e}")
        return jsonify({"error": "Internal server error"}), 500


def fetch_response_from_rid(r_id, responses_collection):
    """
    Fetch the response data for a specified r_id and structure it for results_from_reponses.

    Args:
        r_id (str): The r_id to query (expected to be a valid ObjectId string).
        responses_collection: The MongoDB collection to query.

    Returns:
        dict: A JSON object with the "responses" key containing a list of structured answers, or None.
    """
    try:
        # Validate and convert r_id to ObjectId
        if not ObjectId.is_valid(r_id):
            raise ValueError(f"Invalid ObjectId: {r_id}")

        object_id = ObjectId(r_id)

        # Query the responses collection by _id
        result = responses_collection.find_one({"_id": object_id})

        if not result:
            return None

        # Process and structure the answers
        answers_list = result.get("answers", [])
        structured_responses = [
            {
                "question_id": str(answer["question_id"]),  # Convert ObjectId to string
                "answer": answer.get("answer", ""),  # Include the answer
            }
            for answer in answers_list
            if "question_id" in answer  # Ensure question_id is present
        ]

        return {"responses": structured_responses}

    except Exception as e:
        print(f"Error fetching response from r_id '{r_id}': {e}")
        return None


def fetch_child_data_from_id(child_id, children_collection):
    """
    Fetch the child data for a specified child_id.

    Args:
    - child_id (str): The child_id to query (expected to be a valid ObjectId string).
    - children_collection: The MongoDB collection to query.

    Returns:
    - dict: A JSON object with the child data, or None.
    """

    try:
        # Validate and convert child_id to ObjectId
        if not ObjectId.is_valid(child_id):
            raise ValueError(f"Invalid ObjectId: {child_id}")

        object_id = ObjectId(child_id)

        # Query the children collection by _id
        result = children_collection.find_one({"_id": object_id})

        if not result:
            return None

        result["_id"] = str(result["_id"])
        result["ParentId"] = str(result["ParentId"])

        return result

    except Exception as e:
        print(f"Error fetching child data from child_id '{child_id}': {e}")
        return None


@app.route("/get_child_data_from_id", methods=["GET"])
def get_child_data_from_id():
    """
    Flask route to fetch the child data for a specified child_id.

    Expected query parameter:
    - child_id (str): The ID of the child (expected to be a valid ObjectId string).

    Returns:
    - JSON: The child data if found, otherwise an error message.
    """

    child_id = request.args.get("child_id")
    print(f"[GET CHILD FROM ID] {child_id}")

    if not child_id:
        return jsonify({"error": "child_id parameter is required"}), 400

    try:

        print(f"[GET CHILD FROM ID] {child_id}")

        # Call the service function
        child_data = fetch_child_data_from_id(child_id, children)

        if child_data:
            return jsonify(child_data), 200
        else:
            return (
                jsonify({"message": "No child data found for the specified child"}),
                404,
            )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


def fetch_user_data_from_id(user_id, user_collection):
    """
    Fetch the child data for a specified child_id.

    Args:
    - user_id (str): The user_id to query (expected to be a valid ObjectId string).
    - children_collection: The MongoDB collection to query.

    Returns:
    - dict: A JSON object with the child data, or None.
    """

    try:
        # Validate and convert child_id to ObjectId
        if not ObjectId.is_valid(user_id):
            raise ValueError(f"Invalid ObjectId: {user_id}")

        object_id = ObjectId(user_id)

        # Query the children collection by _id
        result = user_collection.find_one({"_id": object_id})

        if not result:
            return None

        result["_id"] = str(result["_id"])

        return result

    except Exception as e:
        print(f"Error fetching child data from user_id '{user_id}': {e}")
        return None


@app.route("/get_user_data_from_id", methods=["GET"])
def get_user_data_from_id():
    """
    Flask route to fetch the child data for a specified child_id.

    Expected query parameter:
    - user_id (str): The ID of the child (expected to be a valid ObjectId string).

    Returns:
    - JSON: The child data if found, otherwise an error message.
    """

    user_id = request.args.get("user_id")
    print(f"[GET USER FROM ID] {user_id}")

    if not user_id:
        return jsonify({"error": "user_id parameter is required"}), 400

    try:

        print(f"[GET USER FROM ID] {user_id}")

        # Call the service function
        child_data = fetch_user_data_from_id(user_id, users)

        if child_data:
            return jsonify(child_data), 200
        else:
            return (
                jsonify({"message": "No user data found for the specified user"}),
                404,
            )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/populate_psychologist_table", methods=["GET"])
def populate_psychologist_table():
    """
    Function to populate the psychologist table with each student diagnosis data of a school.

    Expected query parameters:
    - school_name: str

    Returns:
    - A JSON object with "candidates" key with list of student data if found, otherwise an error message.
    """

    school_name = request.args.get("school_name")

    # print(f"POP: School name {school_name}")

    if not school_name:
        return jsonify({"error": "school_name parameter is required"}), 400

    try:
        # Use get_all_children_from_school_name function to get all children from the specified school
        children_list = fetch_children_from_school(school_name, children)

        print(f"POP: Got children {children_list}")

        result = []

        for child_id in children_list:
            diagnosis_data = fetch_diagnosis_for_child(child_id)
            if diagnosis_data:
                result.append(diagnosis_data)

        # print(f"POP: Final result {result}")

        return jsonify({"candidates": result}), 200

    except Exception as e:
        print(f"Populate: Error fetching children from school '{school_name}': {e}")
        return jsonify({"error": "An error occurred while fetching children"}), 500


def fetch_diagnosis_for_child(child_id):
    """
    Fetches diagnosis data for a given child.

    Args:
    - child_id (str): The child ID.

    Returns:
    - A dictionary with child diagnosis data if found, otherwise None.
    """
    try:
        # Get r_id from child_id
        child_rid_response = fetch_rid_from_child(child_id, responses)

        print(f"{child_id} - {child_rid_response}")

        if not child_rid_response:
            # Skip this child if no response is found
            return None

        responses_from_rid = fetch_response_from_rid(child_rid_response, responses)

        # print(f"{child_id} - {responses_from_rid}")

        if not responses_from_rid:
            # Error fetching response data
            print(f"No responses found for child '{child_id}'")
            return None

        # Get results from responses
        results_from_responses_result, parent_filled, teacher_filled, age = (
            fetch_results_from_responses(responses_from_rid)
        )

        # print(f"{child_id} - {results_from_responses_result}")

        diagnosis_db = client["result_to_diagnosis"]

        # Get diagnosis from results
        diagnosis_from_results_result, result_code = fetch_diagnosis_from_results(
            age,
            parent_filled,
            teacher_filled,
            results_from_responses_result,
            diagnosis_db,
        )

        # print(f"{child_id} - {diagnosis_from_results_result}")

        # Return the child data with diagnosis
        return {
            "child_id": str(child_id),
            "r_id": str(child_rid_response),
            "diagnosis": diagnosis_from_results_result["diagnosis"],
        }

    except Exception as e:
        print(f"Error fetching diagnosis for child '{child_id}': {e}")
        return None


@app.route("/get_diagnosis_for_child", methods=["GET"])
def get_diagnosis_for_child():
    """
    Flask route to fetch diagnosis data for a given child.

    Expected query parameter:
    - child_id (str): The ID of the child.

    Returns:
    - JSON: The child diagnosis data if found, otherwise an error message.
    """

    child_id = request.args.get("child_id")

    if not child_id:
        return jsonify({"error": "child_id parameter is required"}), 400

    try:
        # Call the service function
        diagnosis_data = fetch_diagnosis_for_child(child_id)

        if diagnosis_data:
            return jsonify(diagnosis_data), 200
        else:
            return (
                jsonify({"message": "No diagnosis data found for the specified child"}),
                404,
            )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


def fetch_unique_schools(children_collection):
    """
    Function to get all unique schools from MongoDB collection.

    Args:
    - children_collection:

    Returns:
    - List of unique schools
    """

    try:
        unique_schools = children_collection.distinct("School")

        if not unique_schools:
            return []

        return unique_schools

    except Exception as e:
        print(f"[F_UNIQ_SCH] {e}")
        raise e


@app.route("/get_unique_schools", methods=["GET"])
def get_unique_schools():
    """
    Flask route to get unique schools list

    Returns:
    - JSON: Unique schools if found, otherwise an error message.
    """
    try:
        unique_schools_list = fetch_unique_schools(children)

        if not unique_schools_list:
            return jsonify({"error": "No schools"})

        return jsonify({"schools": unique_schools_list})

    except Exception as e:
        return

@app.route("/upload", methods=["POST"])
def upload_file():
    # Check if the file and fileType are included in the request
    if "file" not in request.files or "fileType" not in request.form:
        return jsonify({"error": "File or file type not provided"}), 400

    file = request.files["file"]
    file_type = request.form["fileType"]

    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    # Save the file
    try:
        file_path = os.path.join(app.config["DOC_UPLOAD_FOLDER"], file.filename)
        file.save(file_path)

        # Process the file based on its type
        if file_type == "Response to Diagnosis":
            return process_response_to_diagnosis(file_path)
        elif file_type == "Diagnosis Summary":
            return process_diagnosis_summary(file_path)
        elif file_type == "Questions":
            return process_questions(file_path)
        else:
            return jsonify({"error": "Invalid file type"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def process_response_to_diagnosis(file_path):
    print(f"Processing Response to Diagnosis for {file_path}")
    return jsonify({"message": "Processed Response to Diagnosis successfully"})

def process_diagnosis_summary(file_path):
    print(f"Processing Diagnosis Summary for {file_path}")
    return jsonify({"message": "Processed Diagnosis Summary successfully"})

def process_questions(file_path):
    print(f"Processing Questions for {file_path}")
    return jsonify({"message": "Processed Questions successfully"})

if __name__ == "__main__":
    app.run(debug=True, port=5000)