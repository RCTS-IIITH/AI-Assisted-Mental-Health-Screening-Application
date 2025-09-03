# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import Response
from logging_config import logger
from database.chatbot import connect_questionnaire_db
from database.users import connect_users_db
from database.children import connect_children_db
from routers import chat, questionnaire, getter, auth, psychologist, parent, teacher
import os



app = FastAPI()

# Add CORS middleware BEFORE including routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:5173"),  # Your frontend URL
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    ip = request.client.host
    method = request.method
    url = request.url.path
    body = await request.body()
    logger.info(f"IP: {ip} | Method: {method} | URL: {url} | Data Sent: {body.decode('utf-8') if method == 'POST' else 'N/A'}")
    response: Response = await call_next(request)
    if method == "GET":
        logger.info(f"IP: {ip} | Method: {method} | URL: {url} | Data Fetched: {response.body.decode('utf-8') if hasattr(response, 'body') else 'N/A'}")
    return response

@app.on_event("startup")
async def startup_event():
    ques_db = await connect_questionnaire_db()
    getter.router.db = ques_db
    chat.router.db = ques_db
    questionnaire.router.db = ques_db
    users_db = await connect_users_db()
    auth.router.db = users_db
    children_db = await connect_children_db()
    psychologist.router.dbq = ques_db
    psychologist.router.dbc = children_db
    psychologist.router.dbu = users_db
    parent.router.dbu = users_db
    parent.router.dbc = children_db
    teacher.router.dbu = users_db
    teacher.router.dbc = children_db

app.include_router(getter.router, prefix="/api/get", tags=["Getter"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(questionnaire.router, prefix="/api/questionnaire", tags=["Questionnaire"])
app.include_router(parent.router, prefix="/api/parent", tags=["Parent"])
app.include_router(teacher.router, prefix="/api/teacher", tags=["Teacher"])
app.include_router(psychologist.router, prefix="/api/psychologist", tags=["Psychologist"])