import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "your_default_secret_key")
    UPLOAD_FOLDER = "images/"
    DOC_UPLOAD_FOLDER = "uploads"
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    DATABASE_NAME = "projectdsi13"
    
    # CORS Configuration
    CORS_CONFIG = {
        r"/*": {
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
    }

    @staticmethod
    def init_app(app):
        # Create upload directories if they don't exist
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        os.makedirs(Config.DOC_UPLOAD_FOLDER, exist_ok=True) 