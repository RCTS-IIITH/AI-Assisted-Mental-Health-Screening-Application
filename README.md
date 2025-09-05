# AI-Assisted Mental Health Screening Application  

This project is an AI-powered chatbot-based **Mental Health Assessment application** designed primarily for **parents and schools**. It enables rubric-based assessments in a conversational manner, simulating the tone of a psychologist. The system is modular, model-agnostic, and designed to provide age-appropriate, empathetic, and context-aware interactions.  

---

## Key Features  

- **Model-Agnostic Pipeline**  
  Works seamlessly with multiple Large Language Models (LLMs). Users can choose the model that best fits their requirements.  

- **Age-Based Query System**  
  Generates responses in a child-friendly, respectful, and empathetic manner to suit different age groups.  

- **Selective Follow-Up Logic**  
  Maintains conversation flow by intelligently generating follow-up questions where necessary.  

- **Scalable and Efficient**  
  Built with modularity in mind, making it straightforward to extend both backend and frontend independently.  

---

## Tech Stack  

### Backend  
- **FastAPI** – High-performance Python framework for APIs.  
- **LangChain** – Orchestrates LLM workflows, prompt engineering, and reasoning pipelines.  
- **Gemini API** – Integration with Google’s Gemini models.  
- **Hugging Face Transformers** – Support for open-source language models.  
- **MongoDB** – NoSQL database to store user details, test data, and interactions.  

### Frontend  
- **React.js** – Component-based frontend library.  
- **Redux Toolkit** – Simplified state management.  
- **React Router DOM** – Client-side navigation.  
- **Axios** – For API communication.  
- **React-Toastify** – User-friendly notifications and alerts.  
- **Lucide React** – Icon library.  
- **Tailwind CSS** – Utility-first styling framework.  

### Other Tools and Utilities  
- **Uvicorn** – ASGI server for running FastAPI applications.  
- **Python venv** – Virtual environment management.  
- **Node.js / npm** – Runtime and package management for frontend development.  

---

## Steps to Setup and Run  

### 1. Clone the Repository  

```bash
git clone https://github.com/RCTS-IIITH/AI-Assisted-Mental-Health-Screening-Application.git
cd AI-Assisted-Mental-Health-Screening-Application
```

This project contains two main directories:

* `backend/` – Handles APIs, database integration, and application logic.
* `frontend/` – Provides the user-facing interface.

---

### 2. Running the Backend

1. **Create and activate a virtual environment**

   ```bash
   python -m venv venv
   ```

   * On Windows:

     ```bash
     .\venv\Scripts\activate
     ```
   * On macOS/Linux:

     ```bash
     source venv/bin/activate
     ```

2. **Navigate to the backend directory**

   ```bash
   cd backend
   ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

   *(this may take a few minutes depending on your environment)*

4. **Start the backend server**

   ```bash
   uvicorn main:app --reload --port 8000
   ```

   The backend will be running at:

   ```
   http://localhost:8000
   ```

---

### 3. Running the Frontend

1. Open a new terminal and navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install the required packages:

   ```bash
   npm install react-router-dom axios lucide-react react-toastify @reduxjs/toolkit react-redux
   ```

3. Start the development server:

   ```bash
   npm start
   ```

   The frontend will be running at:

   ```
   http://localhost:3000
   ```

---

## System Architecture

The following diagram illustrates the architectural workflow of the **Agentic Chatbot**. It shows the interaction between the frontend, backend services, LLM pipeline, and the database.

![System Architecture](/architecture.png)



---

## User Roles and Permissions

The system supports three types of logins, each with specific responsibilities and permissions:

### 1. Parent

* Can add new children to the system.
* Can delete existing children.
* Can initiate and take mental health tests on behalf of their children.

### 2. Teacher

* Can add children under their supervision.
* Can delete children if required.
* Can initiate and take tests for children assigned to them.

### 3. Psychologist

* Can view all test results taken by students.
* Can access test results on an individual level for detailed diagnosis.
* Can provide professional insights and recommendations based on assessment outcomes.

---

## Directory Structure

```plaintext
.
├── backend
│   ├── database/
│   ├── models/
│   ├── routers/
│   ├── utils/
│   ├── .env
│   ├── access.log
│   ├── logging_config.py
│   ├── main.py
│   ├── requirements.txt
│   └── README.md
│
├── frontend
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── redux/
│   │   ├── utils/
│   │   └── App.js
│   ├── .env
│   ├── package.json
│   ├── package-lock.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── README.md
│
├── .gitignore
└── README.md
```

For more detailed information about specific functionalities, please refer to the `README.md` files located in the `backend/` and `frontend/` directories.

---
