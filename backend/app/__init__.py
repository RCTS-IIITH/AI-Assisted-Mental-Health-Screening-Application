from flask import Flask
from flask_cors import CORS
from .config.config import Config
from .models.db import Database
from .routes.auth import auth_bp
from .routes.questionnaire import questionnaire_bp
from .routes.questions import questions_bp
from .routes.children import children_bp
from .routes.active import active_bp

def create_app(config_class=Config):
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config_class)
    config_class.init_app(app)
    
    # Initialize CORS
    CORS(app, resources=config_class.CORS_CONFIG)
    
    # Initialize database
    Database.init_db()
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(questionnaire_bp)
    app.register_blueprint(questions_bp)
    app.register_blueprint(children_bp)
    app.register_blueprint(active_bp)
    
    return app 