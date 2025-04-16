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
2. Create and activate a virtual environment to manage dependencies separately for this project:


   1. On macOS/Linux:
   ```sh
   cd backend
   python3 -m venv venv
   source venv/bin/activate

   ```
   
    2. On Windows:

    ```sh

   cd backend
   python -m venv venv
   venv\Scripts\activate

    ```


3. Install the required Python packages:
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

### Backend
1. Start the Flask server:
   ```sh
   flask run
   ```

### Frontend
1. Start the React development server:
   ```sh
   npm start
   ```

## Contributing

Contributions are welcome! Please fork the repository and submit pull requests.

## License

This project is licensed under the MIT License.
