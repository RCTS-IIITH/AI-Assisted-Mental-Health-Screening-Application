from typing import Optional, List, Dict, Any
from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace
from langchain_google_genai import ChatGoogleGenerativeAI
import os
from dotenv import load_dotenv

load_dotenv()

# Model registry
MODELS = {
    "Mistral": ChatHuggingFace( llm = HuggingFaceEndpoint(
        repo_id="mistralai/Mistral-7B-Instruct-v0.3",
        task='conversational',
        max_new_tokens=128,
        temperature=0.7,
        huggingfacehub_api_token=os.getenv("HF_TOKEN"),
        )
    ),
    "Zephyr": ChatHuggingFace( llm = HuggingFaceEndpoint(
        repo_id="meta-llama/Llama-3.1-8B-Instruct",
        task='text-generation',
        max_new_tokens=128,
        temperature=0.7,
        huggingfacehub_api_token=os.getenv("HF_TOKEN"),
        )
    ),
    "Llama": ChatHuggingFace( llm = HuggingFaceEndpoint(
        repo_id="meta-llama/Llama-3.1-8B-Instruct",
        task="text-generation",
        max_new_tokens=128,
        temperature=0.7,
        huggingfacehub_api_token=os.getenv("HF_TOKEN")
        )
    ),
    "Gemini": ChatGoogleGenerativeAI(
        model="gemini-2.0-flash-001",
        google_api_key=os.getenv("GOOGLE_API_KEY")
    )
}

# Global database connection
db = None

questions_asked: Dict[str, set] = {}
questions: Dict[str, Any] = {}
last_question_index: Dict[str, int] = {}
status : Dict[str, bool] = {}

otp_store: Dict[str, int] = {}
