## Project Overview

This project is a web application designed to facilitate interactions between students, parents, teachers, and psychologists. It includes various dashboards for different user roles, allowing them to manage questionnaires, view responses, and more.

## Features

- User Authentication (Sign Up, Login)
- Role-based Dashboards (Student, Parent, Teacher, Psychologist)
- Questionnaire Management
- Response Viewing and Analysis
- File Uploads

## Technologies Used

### Frontend
- React
- Redux
- React Router
- Axios
- Chart.js

### Backend
- Flask
- Flask-Cors
- PyMongo
- Bcrypt
- PyJWT
- Python-Dotenv

## Installation

### Backend
1. Navigate to the `backend` directory:
   ```sh
   cd backend
   ```
2. Install the required Python packages:
   ```sh
   pip install -r requirements.txt
   ```

### Frontend
1. Navigate to the project root directory:
   ```sh
   cd ..
   ```
2. Install the required Node packages:
   ```sh
   npm install
   ```

## Running the Application

### Backend (management)
1. Start the Flask server:
   ```sh
   flask run
   ```
### ChatBackend
1. move to chatbot folder:
   ```sh
   cd chatbot
   ```
2. Start the fastAPI server:
   ```sh
   uvicorn app:app --reload --port 8000
   ```

### Frontend
1. Get to the frontend folder:
   ```sh
   cd ..
   cd ..
   cd frontend
   ```
2. Start the React development server:
   ```sh
   npm start
   ```

## Contributing

Contributions are welcome! Please fork the repository and submit pull requests.

## License

This project is licensed under the MIT License.
