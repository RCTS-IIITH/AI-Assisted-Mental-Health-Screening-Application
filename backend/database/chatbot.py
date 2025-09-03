from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import logging
from dotenv import load_dotenv
import json
import numpy as np
from sentence_transformers import SentenceTransformer
import asyncio

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

logger = logging.getLogger(__name__)

async def connect_questionnaire_db():
    """Connect to MongoDB database"""
    try:
        connection_string = os.getenv("CONNECTION_STRING")
        if not connection_string:
            logger.error("CONNECTION_STRING environment variable not set.")
            raise Exception("CONNECTION_STRING environment variable not set.")

        client = AsyncIOMotorClient(connection_string)
        db = client["questionaires"]
        # Test connection
        await db.command('ping')
        logger.info("Successfully connected to MongoDB.")
        return db

    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {e}", exc_info=True)
        raise

async def get_embedding(text):
    embedding = await asyncio.to_thread(model.encode, text, normalize_embeddings=True)
    return embedding.tolist()

async def insert_dataset(db, dir_path):
    """Insert dataset from JSON file into MongoDB"""
    try:
        # Check if file exists
        uploaded_questionaires = []
        failed_questionaires = []
        file_paths = [os.path.join(dir_path, f) for f in os.listdir(dir_path) if f.endswith('.json')]
        for file_path in file_paths:
            if not os.path.exists(file_path):
                logger.error(f"Dataset file not found: {file_path}")
                raise FileNotFoundError(f"Dataset file not found: {file_path}")
                
            with open(file_path, "r", encoding="utf-8") as f:
                dataset = json.load(f)

            
            for question in dataset.get("questions", []):
                question["question_vector"] = await get_embedding(question["question"])
            questionair_name = dataset.get("questionnaire")
            questions = dataset.get("questions", [])

            if not questionair_name:
                logger.warning("No 'questionair' name found in the dataset.")
                failed_questionaires.append(questionair_name)
                continue

            if not questions:
                logger.warning("No questions found in the dataset to upload.")
                failed_questionaires.append(questionair_name)
                continue

            # Check if questionair already exists
            existing_questionair = await db["questionaires"].find_one({"questionnaire": questionair_name})
            if existing_questionair:
                logger.info(f"Questionnaire '{questionair_name}' already exists. Skipping upload.")
                failed_questionaires.append(questionair_name)
                continue

            # Insert the dataset
            insert_result = await db["questionaires"].insert_one(dataset)
            
            logger.info(f"Inserted questionair '{questionair_name}' with ID: {insert_result.inserted_id}")
            uploaded_questionaires.append(questionair_name)
        return {"status": "success", "message": f"Successfully uploaded questionairs:\n'{uploaded_questionaires} \n Failed to upload questionairs:\n {failed_questionaires}"}
        
    except FileNotFoundError as e:
        logger.error(f"Dataset file not found: {dir_path}")
        raise e
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in dataset file: {e}")
        raise Exception(f"Invalid JSON in dataset file: {str(e)}")
    except Exception as e:
        logger.error(f"Error inserting dataset into MongoDB: {e}")
        raise Exception(f"Error inserting dataset: {str(e)}")

async def get_questionair(db, questionair_name):
    """Retrieve a specific questionair from the database"""
    try:
        questionair = await db["questionaires"].find_one({"questionnaire": questionair_name})
        if questionair:
            # Convert ObjectId to string for JSON serialization
            questionair["_id"] = str(questionair["_id"])
            return questionair
        return None
    except Exception as e:
        logger.error(f"Error retrieving questionair '{questionair_name}': {e}")
        raise Exception(f"Error retrieving questionair: {str(e)}")

async def list_questionairs(db):
    """List all available questionairs"""
    try:
        cursor = db["questionaires"].find({}, {"questionnaire": 1, "instructions":3, "_id": 0})
        questionairs = await cursor.to_list(length=None)
        return [{"name":q["questionnaire"], "instructions":q["instructions"]} for q in questionairs]
    except Exception as e:
        logger.error(f"Error listing questionairs: {e}")
        raise Exception(f"Error listing questionairs: {str(e)}")
    
async def get_chat(db, session_id):
    """Retrieve a specific chat from the database"""
    try:
        chat = await db["chats"].find_one({"session_id": session_id})
        if chat:
            # Convert ObjectId to string for JSON serialization
            chat["_id"] = str(chat["_id"])
            return chat
        return None
    except Exception as e:
        logger.error(f"Error retrieving questionair '{session_id}': {e}")
        raise Exception(f"Error retrieving questionair: {str(e)}")
    
async def store_chat_response(db, session_id, role, best_question_data, message):
    """Store a chat response in the database"""
    try:
        chat = await db["chats"].find_one({"session_id": session_id})
        if not chat:
            # Create a new chat if it doesn't exist
            chat = {
                "session_id": session_id,
                "conversation": []
            }
        
        # Append the new message to the conversation
        if(role == 'bot'):
            chat["conversation"].append({
                "role": role,
                "question_index": best_question_data[0],
                "question": best_question_data[1],
                "message": message
            })
        elif(role == "user"):
            chat["conversation"].append({
                "role": role,
                "message": message
            })
        else:
            chat["feedback"] = message
        
        # Upsert the chat document
        await db["chats"].update_one(
            {"session_id": session_id},
            {"$set": chat},
            upsert=True
        )
        
        logger.info(f"Stored response for session {session_id}")
    except Exception as e:
        logger.error(f"Error storing chat response: {e}")
        raise Exception(f"Error storing chat response: {str(e)}")