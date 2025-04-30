import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection details
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "mental_health_screening")

# Async client for FastAPI
async_client = AsyncIOMotorClient(MONGO_URI)
async_db = async_client[DB_NAME]

# Sync client for utility functions
sync_client = MongoClient(MONGO_URI)
sync_db = sync_client[DB_NAME]

# Collections
users_collection = async_db.users
conversations_collection = async_db.conversations
resources_collection = async_db.resources
questions_collection = async_db.questions
assessments_collection = async_db.assessments
vector_collection = async_db.vectors

# Sync collections for utility functions
sync_users_collection = sync_db.users
sync_conversations_collection = sync_db.conversations
sync_resources_collection = sync_db.resources
sync_questions_collection = sync_db.questions
sync_assessments_collection = sync_db.assessments
sync_vector_collection = sync_db.vectors

# Create indexes
async def create_indexes():
    await users_collection.create_index("email", unique=True)
    await conversations_collection.create_index("user_id")
    await vector_collection.create_index([("vector", "2dsphere")])
    
# Helper functions
async def get_user_by_email(email):
    return await users_collection.find_one({"email": email})

async def get_user_by_id(user_id):
    return await users_collection.find_one({"_id": user_id})

async def get_conversation_history(user_id, limit=10):
    cursor = conversations_collection.find({"user_id": user_id}).sort("timestamp", -1).limit(limit)
    return await cursor.to_list(length=limit)

async def store_conversation(user_id, message, response, metadata=None):
    doc = {
        "user_id": user_id,
        "message": message,
        "response": response,
        "timestamp": datetime.utcnow(),
        "metadata": metadata or {}
    }
    result = await conversations_collection.insert_one(doc)
    return result.inserted_id

# Initialize the database
async def init_db():
    try:
        await create_indexes()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Database initialization error: {e}")

# Close connections
def close_connections():
    async_client.close()
    sync_client.close()