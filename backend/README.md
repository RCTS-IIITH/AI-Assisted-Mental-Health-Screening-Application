# Backend Overview

Here I am discussing the backend

## Directory Structure
```
backend/
├── database/                   # Database-related logics
│   ├── chatbot.py
│   ├── children.py
│   └── users.py
│
├── models/                     # Data models (Pydantic)
│   ├── chatbot.py
│   ├── children.py
│   └── users.py
│
├── routers/                    # API route handlers
│   ├── auth.py
│   ├── chat.py
│   ├── getter.py
│   ├── parent.py
│   ├── psychologist.py
│   ├── questionnaire.py
│   └── teacher.py
│
├── utils/                      # Helper functions and RAG pipeline
│   ├── logging_config.py
│   ├── rag_chain.py
│   ├── users.py
│   └── utils.py
│
├── .env                        # Environment variables
├── access.log                  # Log file
├── logging_config.py           # Logging configuration
└── main.py                     # FastAPI entry point
```
---
## Database
This directory consist of db instantiations for chatbot, children and users. 
It also consist of utility fucntions specifically related to database data fetch and update. 
Some functions defined in these files are as follows.
### `chatbot.py`
`connect_questionnaire_db` : Connects to the MongoDB database and verifies connection.  

`get_embedding` : Generates a normalized sentence embedding for given text using a transformer model.  

`insert_dataset` : Inserts questionnaire datasets from JSON files into MongoDB with embeddings.  

`get_questionair` : Retrieves a specific questionnaire from the database by its name.  

`list_questionairs` : Lists all available questionnaires with their names and instructions.  

`get_chat` : Fetches a chat session from the database by session ID.  

`store_chat_response` : Stores or updates user/bot/feedback messages in a chat session document.  

### `children.py`
`connect_children_db` : Connects to the MongoDB `children_db` database and verifies the connection.  

`get_child_by_id` : Fetches a single child record by its unique ID.  

`get_all_school_children` : Retrieves all children records that are associated with a school.  

`get_child_by_school` : Fetches all child records belonging to a specific school.  

### `users.py`
`hash_password` : Hashes a plain-text password using bcrypt.  

`verify_password` : Verifies a plain-text password against its bcrypt hash.  

`create_access_token` : Generates a JWT access token with expiration and issued-at timestamps.  

`verify_token` : Decodes and validates a JWT token, raising errors if expired or invalid.  

`send_otp` : Sends an OTP via SMS to a given mobile number using Twilio Verify API.  

`verify_otp` : Verifies a user-provided OTP against Twilio Verify service.  

---
## Models
Consist of request and response PyDantic models for easy and factored POST services.

---

## APIs (Routers)
All the APIs are coded in the `routers/` directory inside `backend/`.

### `auth.py`

* POST `/api/auth/signup`
  - Registers a new user.
  - **Request Body:** `UserSignup`
    * Verifies if the mobile is already registered.
    * Verifies OTP before creating the user.

* POST `/api/auth/login`
  - Logs in a user with mobile and password.
  - **Request Body:** `UserLogin`
    * Returns access token (JWT), user details (without password), and expiry time.

* GET `/api/auth/profile`
  - Fetches the profile of the currently logged-in user.
  - **Requirements:** Valid JWT token (`Depends(get_current_user)`).

* POST `/api/auth/logout`
  - Logs out a user.
    * Token invalidation is handled client-side.

* POST `/api/auth/refresh-token`
  - Generates a new access token for the logged-in user.
  - **Requirements:** Valid JWT token.

* POST `/api/auth/send-otp`
  - Sends an OTP to the provided mobile number.
  - **Request Body:** `SendOtpRequest`
    * Returns status if OTP is sent.

* POST `/api/auth/change-password`
  - Changes the password for a registered user.
  - **Request Body:** `ChangePass`
    * Verifies if the mobile is registered before updating password.

* POST `/api/auth/verify-otp`
  - Verifies an OTP for a given mobile number.
  - **Request Body:** `VerifyOtpRequest`
    * Returns success only if OTP is approved.

### `chat.py`

* POST `/api/chat/stream`
  - Streams chatbot responses in real-time using Server-Sent Events (SSE).
  - **Request Body:** `ChatRequest`
    * Validates that the selected model exists in `MODELS`.
    * Stores the user’s question in chat history.
    * Performs similarity search on questionnaire embeddings to pick the best next question.
    * Uses RAG chain (`get_chain`) to generate a streamed or full response.
    * Stores bot responses back in chat history.
    * Returns event-stream with incremental chunks, completion flag, and status.


### `getter.py`

* GET `/api/getter/ping`
  - Health check endpoint.
    * Returns status and confirmation that the FastAPI server is running.

* GET `/api/getter/models`
  - Retrieves a list of available models.
    * Uses `MODELS` dictionary to return supported model keys.

* GET `/api/getter/questionnaires`
  - Lists all available questionnaires.
    * Fetches from database using `list_questionairs`.

* GET `/api/getter/questionnaire/{questionnaire}`
  - Fetches details of a specific questionnaire by name.
    * Removes internal `_id` and `question_vector` fields before returning.

* GET `/api/getter/chat/{session_id}`
  - Retrieves chat history for a specific session.
    * Returns stored conversation for the given `session_id`.

### `parent.py`

* POST `/api/parent/add-child`
  - Adds a new child for a parent.
  - **Request Body:** `AddChildRequest`
    * Validates if a child with the same `name` and `dob` already exists.
    * Calculates age from `dob`.
    * Adds `created_at` and `updated_at` timestamps.
    * Stores child in DB.
    * Returns `child_id` on success.

* POST `/api/parent/children`
  - Retrieves all children for a given parent.
  - **Request Body:** `GetChildren`
    * Fetches children linked with `parent_mobile`.
    * Converts `_id` to string.
    * Returns list of children.

* POST `/api/parent/delete-child`
  - Deletes a child by ID.
  - **Request Body:** `ChildRequest`
    * Requires `child_id`.
    * Deletes the child document from DB.
    * Returns success message if deletion occurs.
### `psychologist.py`

* GET `/api/psychologist/get-unique-schools`
  - Retrieves unique schools from the database.
    * Uses `chats.distinct("school")` to find all schools.
    * Filters out empty/null values.
    * Returns list of schools.
    * Raises `404` if no schools found.

* GET `/api/psychologist/chat/{session_id}`
  - Fetches chat history by session ID.
    * Calls `get_chat` from database.
    * Returns chat object if found.
    * Raises `404` if chat does not exist.

* GET `/api/psychologist/chat-responses`
  - Retrieves chat responses without full conversation details.
    * Excludes `conversation` and `_id` fields.
    * Returns list of responses.

* POST `/api/psychologist/update-diagnosis`
  - Updates the diagnosis for a given chat session.
  - **Request Body:** `UpdateDiagnosisRequest`
    * Requires `session_id` and new `diagnosis`.
    * Updates chat record in DB.
    * Returns success message.

* POST `/api/psychologist/children-by-school`
  - Fetches all children belonging to a specific school.
  - **Request Body:** `GetChildBySchool`
    * Requires `school` name.
    * Returns list of children (with `_id` converted to string).
    * Raises `404` if no children found for that school.
### `questionnaire.py`

* POST `/api/questionnaire/start`
  - Starts a new questionnaire session.
  - **Request Body:** `QuestionnaireStartRequest`
    * Requires `tnc_accepted = true`.
    * Fetches questionnaire details from DB.
    * Auto-generates `session_id` if not provided.
    * Computes `student_age` from DOB.
    * Determines guardian role (`teacher` or `parent`).
    * Initializes empty `conversation` and sets `diagnosis = None`.
    * Stores questionnaire state in DB and in-memory trackers (`questions_asked`, `questions`, `last_question_index`, `status`).
    * Returns generated `session_id`.

* POST `/api/questionnaire/end`
  - Ends a questionnaire session and stores user feedback.
  - **Request Body:** `EndRequest`
    * Requires `session_id` and `feedback`.
    * Saves feedback into the chat record via `store_chat_response`.
    * Returns success message.
### `teacher.py`

* POST `/api/teacher/add-child`
  - Adds a new child record for a teacher.
  - **Request Body:** `AddChildRequest`
    * Checks if a child with the same `name`, `dob`, and `school` already exists.
    * Calculates child’s `age` from DOB.
    * Adds `created_at` and `updated_at` timestamps.
    * Inserts child record into DB.
    * Returns success message with `child_id`.

* POST `/api/teacher/children`
  - Fetches all children associated with a given teacher.
  - **Request Body:** `GetChildren`
    * Requires `teacher_mobile`.
    * Returns list of children (with `_id` converted to string).

* POST `/api/teacher/children-by-school`
  - Retrieves all children records belonging to a specific school.
  - **Request Body:** `GetChildBySchool`
    * Requires `school` name.
    * Returns list of children (with `_id` converted to string).
    * Raises `404` if no children found.

* POST `/api/teacher/delete-child`
  - Deletes a child record by ID.
  - **Query Parameters:** `ChildRequest`
    * Requires `child_id`.
    * Deletes the matching record from DB.
    * Raises `404` if child not found.
    * Returns success message.
---
## Utils
### `logging_config.py`

Centralized logging setup for the application.

- **Log file creation**  
  - Ensures `access.log` exists in the project root.  

- **Configuration**
  - Format: `%(asctime)s - %(levelname)s - %(message)s`
  - Level: `INFO`
  - Handlers:
    - `FileHandler` → Appends logs to `access.log`
    - `StreamHandler` → Prints logs to console  

- **Logger**
  - `logger = logging.getLogger("access_logger")`  
  - Import this `logger` across the project for consistent logging.

✅ All modules use the same logger → messages appear both in console and `access.log`.  

### `rag_chain.py`

**Function:** `get_chain(llm, chat_history=None, age=15, question="") -> Runnable`

- Builds a LangChain pipeline for empathetic mental-health questioning.  
- Uses `ChatPromptTemplate` → `llm` → `StrOutputParser`.  
- Rephrases questions in a compassionate, non-intrusive way.  
- Includes chat history and user’s latest input as context.  
- Skips consolidation sentence if input is `"/start"`.  

**Usage:**
```python
chain = get_chain(llm, chat_history={"conversation": []}, question="How do you feel today?")
response = chain.invoke({"input": "I am okay"})
```

### `users.py`

Utility functions for authentication, password security, JWT handling, and OTP via Twilio.

- **Password**
  - `hash_password(password: str) -> str` — Hash with bcrypt.  
  - `verify_password(password, hashed_password) -> bool` — Verify bcrypt hash.  

- **JWT**
  - `create_access_token(data: dict) -> str` — Creates JWT (24h expiry).  
  - `verify_token(token: str) -> dict` — Validates & decodes JWT.  

- **OTP (Twilio)**
  - `send_otp(mobile)` — Sends OTP to given mobile.  
  - `verify_otp(mobile, otp)` — Verifies OTP status.  

Uses `.env` for `JWT_SECRET_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFICATION_SID`.

### `utils.py`

Core utilities for model registry, global DB reference, and in-memory state.

- **Model Registry (`MODELS`)**
  - `"Mistral"` → HuggingFace (`Mistral-7B-Instruct-v0.3`)  
  - `"Zephyr"` → HuggingFace (`Llama-3.1-8B-Instruct`)  
  - `"Llama"` → HuggingFace (`Llama-3.1-8B-Instruct`)  
  - `"Gemini"` → Google Generative AI (`gemini-2.0-flash-001`)  

  Each model is wrapped with `ChatHuggingFace` or `ChatGoogleGenerativeAI`.

- **How to Add a New Model**
  1. Add a new entry inside the `MODELS` dictionary.  
     Example (HuggingFace):
     ```python
     "NewModel": ChatHuggingFace(
         llm=HuggingFaceEndpoint(
             repo_id="org/model-name",
             task="text-generation",
             max_new_tokens=128,
             temperature=0.7,
             huggingfacehub_api_token=os.getenv("HF_TOKEN")
         )
     )
     ```
     Example (Google):
     ```python
     "Gemini-Pro": ChatGoogleGenerativeAI(
         model="gemini-2.0-pro",
         google_api_key=os.getenv("GOOGLE_API_KEY")
     )
     ```
  2. No other changes are required — all APIs using `MODELS` automatically recognize the new model.

- **Globals**
  - `db`: Placeholder for MongoDB connection.  
  - `questions_asked`: Maps session → set of asked question indices.  
  - `questions`: Maps session → questionnaire questions.  
  - `last_question_index`: Tracks last question index asked.  
  - `status`: Tracks completion state per session.  
  - `otp_store`: Temporary OTP storage (mobile → OTP).  


---
## .ENV
We need following environment variables for seamless execution of the code.
`HF_TOKEN` : Huggingface token
`FRONTEND_URL` : URL to provide CORS configuration for frontend
`CONNECTION_STRING` : for mongodb database
`GOOGLE_API_KEY` : Required if Gemini is one of the models
`SMS_API_KEY` : From Twillio account
`TWILIO_ACCOUNT_SID` : From Twillio account
`TWILIO_AUTH_TOKEN` : From Twillio account
`TWILIO_VERIFICATION_SID` : From Twillio account
`JWT_SECRET_KEY` : Can be any string I used "*AI_Assisted_Mental_Health_Screening_Application*"

---

## `main.py`

Entry point for the FastAPI application.  
Configures CORS, logging middleware, database connections, and router registration.


#### 🔹 Middleware
- **CORS**: Allows frontend requests (`FRONTEND_URL` and `http://localhost:3000`).
- **Request Logging**: Logs client IP, method, URL, and request/response data.


#### 🔹 Routers & Endpoints

| Router          | Prefix            | Tags             | Database Access |
|-----------------|------------------|------------------|-----------------|
| `getter`        | `/api/get`       | `Getter`         | **Questionnaire DB** |
| `auth`          | `/api/auth`      | `Auth`           | **Users DB** |
| `chat`          | `/api/chat`      | `Chat`           | **Questionnaire DB** |
| `questionnaire` | `/api/questionnaire` | `Questionnaire` | **Questionnaire DB** |
| `parent`        | `/api/parent`    | `Parent`         | **Users DB** + **Children DB** |
| `teacher`       | `/api/teacher`   | `Teacher`        | **Users DB** + **Children DB** |
| `psychologist`  | `/api/psychologist` | `Psychologist` | **Users DB** + **Children DB** + **Questionnaire DB** |

#### 🔹 Database Connections
- `connect_questionnaire_db()` → Shared by `getter`, `chat`, `questionnaire`, `psychologist`.  
- `connect_users_db()` → Shared by `auth`, `parent`, `teacher`, `psychologist`.  
- `connect_children_db()` → Shared by `parent`, `teacher`, `psychologist`.  

---

### `requirements.txt`
Consist of the all the necessary packages needed for seemless executon of the backednd
use `pip install -r requirements.txt`

---

### END OF DOC