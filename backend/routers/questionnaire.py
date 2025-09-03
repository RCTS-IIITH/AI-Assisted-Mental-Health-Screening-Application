from fastapi import APIRouter, HTTPException
from models.chatbot import QuestionnaireStartRequest, EndRequest
from database.chatbot import get_questionair, store_chat_response
from utils.utils import questions_asked, questions, last_question_index, status
import logging
import datetime

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/start")
async def start_questionnaire(request: QuestionnaireStartRequest):
    if not request.tnc_accepted:
        raise HTTPException(status_code=400, detail="Terms and Conditions must be accepted to start the questionnaire")
    try:
        # Get questionnaire data from database
        questionnaire_data = await get_questionair(router.db, request.questionnaire_name)
        if not questionnaire_data:
            raise HTTPException(status_code=404, detail=f"Questionnaire '{request.questionnaire_name}' not found")
        
        # Generate session ID if not provided
        session_id = request.session_id or f"session_{request.student_name}_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"

        data = request.dict()
        data["session_id"] = session_id
        data["student_age"] = datetime.datetime.now().year - int(data["student_dob"].split("-")[0])
        data["gaurdian_role"] = "teacher" if request.teacher_name else "parent"
        data["gaurdian_name"] = request.teacher_name if request.teacher_name else request.parent_name
        data["conversation"] = []
        data["diagnosis"] = None
        
        await router.db["chats"].insert_one(data)
        
        questions_asked[session_id] = set()
        questions[session_id] = questionnaire_data["questions"]
        last_question_index[session_id] = 0
        status[session_id] = False

        return {"session_id": session_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting questionnaire: {e}")
        raise HTTPException(status_code=500, detail=f"Error starting questionnaire: {str(e)}")

@router.post("/end")
async def end_questionnaire(request: EndRequest):
    try:
        await store_chat_response(router.db, request.session_id, "feedback", [], request.feedback)
        return {"message": "Thank for your feedback. Feedback saved successfully! You may now leave the page"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error setting up stream: {e}")
        raise HTTPException(status_code=500, detail=f"Error setting up stream: {str(e)}")