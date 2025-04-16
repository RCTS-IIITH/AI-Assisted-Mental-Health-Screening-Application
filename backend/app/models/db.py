from pymongo import MongoClient
from ..config.config import Config

class Database:
    client = None
    db = None
    
    @staticmethod
    def init_db():
        try:
            Database.client = MongoClient(Config.MONGO_URI)
            Database.db = Database.client[Config.DATABASE_NAME]
            
            # Initialize collections
            Database.users = Database.db["users"]
            Database.children = Database.db["children"]
            Database.questions = Database.db["questions"]
            Database.responses = Database.db["responses"]
            Database.questionnaire = Database.db["questionnaire"]
            Database.rubrics = Database.db["rubrics"]
            Database.active = Database.db["active"]
            
            # Test connection
            Database.client.server_info()
            print("Successfully connected to MongoDB")
            
        except Exception as e:
            print(f"Error connecting to MongoDB: {e}")
            raise e
    
    @staticmethod
    def close_db():
        if Database.client:
            Database.client.close() 