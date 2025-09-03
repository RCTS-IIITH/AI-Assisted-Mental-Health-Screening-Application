from fastapi import APIRouter, HTTPException
from database.chatbot import list_questionairs, get_questionair, get_chat
from models.chatbot import UpdateDiagnosisRequest
from models.children import GetChildBySchool
from database.chatbot import get_chat
from utils.utils import MODELS, db
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/get-unique-schools")
async def get_unique_schools():
    """Get unique schools from the database"""
    try:
        schools = await router.dbq.chats.distinct("school")
        schools = [school for school in schools if school]  # Filter out empty values
        if not schools:
            raise HTTPException(status_code=404, detail="No schools found in the database")
        return {"schools": schools}
    except Exception as e:
        logger.error(f"Error fetching unique schools: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching unique schools: {str(e)}")

@router.get("/chat/{session_id}")
async def get_chat_by_id(session_id: str):
    """Get chat history for a specific session"""
    try:
        chat = await get_chat(router.dbq, session_id)
        if not chat:
            raise HTTPException(status_code=404, detail=f"Chat with session ID '{session_id}' not found")
        return {"chat": chat}
    except Exception as e:
        logger.error(f"Error fetching chat for session '{session_id}': {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching chat: {str(e)}")

@router.get("/chat-responses")
async def get_chat_responses():
    """Get chat responses from the database"""
    try:
        responses = await router.dbq.chats.find({},{"conversation":0, "_id":0}).to_list(length=None)
        
        return {"responses": responses}
    except Exception as e:
        logger.error(f"Error fetching chat responses: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching chat responses: {str(e)}")

@router.post("/update-diagnosis")
async def updateDiagnosis(req: UpdateDiagnosisRequest):
    session_id = req.session_id
    chat_data = await router.dbq.chats.find_one({"session_id": session_id})
    if not chat_data:
        raise HTTPException(status_code=404, detail=f"Chat with session ID '{session_id}' not found")
    
    chat_data["diagnosis"] = req.diagnosis
    await router.dbq.chats.update_one({"session_id": session_id}, {"$set": chat_data})
    return {"message": "Diagnosis updated successfully"}


@router.post("/children-by-school")
async def getChildrenBySchool(req: GetChildBySchool):
    school = req.school
    if not school:
        raise HTTPException(status_code=400, detail="School name is required")
    
    children = await router.dbc.children.find(
        {"school": school},
    ).to_list(length=None)

    for child in children:
        child["_id"] = str(child["_id"])
    
    if not children:
        raise HTTPException(status_code=404, detail=f"No children found for school '{school}'")
    
    return {"children": children}