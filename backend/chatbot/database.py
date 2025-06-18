from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import logging
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

async def connect_db():
    """Connect to MongoDB database"""
    load_dotenv()
    # Fixed typo: MOGODB -> MONGODB
    CONNECTION_STRING = os.getenv("CONNECTION_STRING")
    if not CONNECTION_STRING:
        logger.error("CONNECTION_STRING environment variable not set.")
        raise Exception("CONNECTION_STRING environment variable not set.")

    try:
        client = AsyncIOMotorClient(CONNECTION_STRING)
        db = client["questionaires"]
        # Test connection
        await db.command('ping')
        logger.info("Successfully connected to MongoDB.")
        return db
    
    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {e}")
        raise Exception(f"Failed to connect to MongoDB: {e}")

async def insert_dataset(db, file_path):
    """Insert dataset from JSON file into MongoDB"""
    try:
        # Check if file exists
        if not os.path.exists(file_path):
            logger.error(f"Dataset file not found: {file_path}")
            raise FileNotFoundError(f"Dataset file not found: {file_path}")
            
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        questionair_name = data.get("questionair")
        questions = data.get("questions", [])

        if not questionair_name:
            logger.warning("No 'questionair' name found in the dataset.")
            return {"status": "warning", "message": "No 'questionair' name found in the dataset"}

        if not questions:
            logger.warning("No questions found in the dataset to upload.")
            return {"status": "warning", "message": "No questions found in the dataset"}

        # Check if questionair already exists
        existing_questionair = await db["questionaires"].find_one({"questionair": questionair_name})
        if existing_questionair:
            logger.info(f"Questionair '{questionair_name}' already exists. Skipping upload.")
            return {"status": "skipped", "message": f"Questionair '{questionair_name}' already exists."}

        # Insert the dataset
        insert_result = await db["questionaires"].insert_one(data)
        
        logger.info(f"Inserted questionair '{questionair_name}' with ID: {insert_result.inserted_id}")
        return {"status": "success", "message": f"Successfully uploaded questionair '{questionair_name}'."}
        
    except FileNotFoundError as e:
        logger.error(f"Dataset file not found: {file_path}")
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
        questionair = await db["questionaires"].find_one({"questionair": questionair_name})
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
        cursor = db["questionaires"].find({}, {"questionair": 1, "instructions":3, "_id": 0})
        questionairs = await cursor.to_list(length=None)
        return [{"name":q["questionair"], "instructions":q["instructions"]} for q in questionairs]
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
