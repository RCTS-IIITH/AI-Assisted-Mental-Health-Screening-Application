from fastapi import APIRouter, HTTPException
from database.chatbot import list_questionairs, get_questionair, get_chat
from utils.utils import MODELS, db
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/ping")
async def ping():
    """Health check endpoint"""
    return {"status": "ok", "message": "FastAPI server is running"}

@router.get("/models")
async def get_available_models():
    """Get list of available models"""
    return {"models": list(MODELS.keys())}

@router.get("/questionnaires")
async def get_questionnaires():
    """Get list of available questionnaires"""
    try:
        questionnaires = await list_questionairs(router.db)
        return {"questionnaires": questionnaires}
    except Exception as e:
        logger.error(f"Error fetching questionnaires: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching questionnaires: {str(e)}")

@router.get("/questionnaire/{questionnaire}")
async def get_questionnaire(questionnaire: str):
    """Get specific questionnaire by questionnaire name"""
    try:
        questionnaire = await get_questionair(router.db, questionnaire)
        if not questionnaire:
            raise HTTPException(status_code=404, detail=f"Questionnaire '{questionnaire}' not found")
        del questionnaire["_id"]
        for q in questionnaire["questions"]:
            if "question_vector" in q:
                del q["question_vector"]
        return {"questionnaire": questionnaire}
    except Exception as e:
        logger.error(f"Error fetching questionnaire '{questionnaire}': {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching questionnaire '{questionnaire}': {str(e)}")

@router.get("/chat/{session_id}")
async def get_chat_by_id(session_id: str):
    """Get chat history for a specific session"""
    try:
        chat = await get_chat(router.db, session_id)
        if not chat:
            raise HTTPException(status_code=404, detail=f"Chat with session ID '{session_id}' not found")
        return {"chat": chat}
    except Exception as e:
        logger.error(f"Error fetching chat for session '{session_id}': {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching chat: {str(e)}")