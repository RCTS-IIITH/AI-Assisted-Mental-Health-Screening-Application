## Frontend Overview

The `frontend/` directory contains the client-side implementation of the application.  
It is built using **React.js** along with supporting libraries such as **Redux** for state management and **Tailwind CSS** for styling.  

Below is the complete directory structure:

```

frontend/
├── node_modules/               # Installed dependencies
├── public/                     # Public assets
├── src/                        # Core source code
│   ├── components/             # Reusable UI components
│   │   ├── AddQuestionnaire.js
│   │   └── QuestionnaireDetails.js
│   │
│   ├── pages/                  # Major page-level components
│   │   ├── Login.js
│   │   ├── ParentDashboard.js
│   │   ├── PsychologistDashboard.js
│   │   ├── QuestionnaireBot.js
│   │   ├── ResponseTable.js
│   │   └── TeacherDashboard.js
│   │
│   ├── redux/                  # Redux store and state slices
│   │   ├── authSlice.js
│   │   ├── childrenSlice.js
│   │   ├── questionnaireSlice.js
│   │   └── store.js
│   │
│   ├── utils/                  # Helper utilities
│   │   └── auth.js
│   │
│   ├── App.css                 # Global styles
│   ├── App.js                  # Root React component
│   └── App.test.js             # Tests for App component
│
├── package-lock.json           # Dependency lock file
├── package.json                # Project metadata & dependencies
├── postcss.config.js           # PostCSS configuration
├── tailwind.config.js          # Tailwind CSS configuration
└── .env                        # Environment variables
```
---

### Components

The `components/` directory includes UI elements that are **reused across pages**.  
These are mostly tied to questionnaire management for psychologists.

- **AddQuestionnaire.js** – Allows psychologists to add a new questionnaire to the dataset.  
- **QuestionnaireDetails.js** – Displays details of an existing questionnaire.  

---

### Pages

The `pages/` directory defines **high-level views** for different user roles.  
Each page corresponds to a major functionality in the system:

- **Login.js** – Handles authentication (login, signup, and password recovery).  
- **ParentDashboard.js** – Provides features and test access for parents.  
- **PsychologistDashboard.js** – Enables psychologists to view results and manage assessments.  
- **QuestionnaireBot.js** – Core conversational interface where students take tests.  
- **ResponseTable.js** – Displays test results for psychologists to review student responses.  
- **TeacherDashboard.js** – Provides teachers with functionality to manage students and initiate tests.  

---

### Redux

State management is handled via **Redux Toolkit**.  
Each slice manages a specific part of the application state:

- **authSlice.js** – Authentication state and actions (login, logout, token management).  
- **childrenSlice.js** – Stores and manages data about children for quick access across the application.  
- **questionnaireSlice.js** – Manages active questionnaire data and associated student test records.  
- **store.js** – Combines all slices into the central Redux store.  

---

### Utilities

The `utils/` directory provides helper functions.  

- **auth.js** – Authentication-related utility logic, including API calls and token handling.  

---

### Environment Variables

The `.env` file allows configuration without hardcoding values:  

- `REACT_APP_BACKEND_URL` – Defines the backend API base URL, enabling dynamic API access.  

---

This structure ensures a **modular, scalable, and maintainable frontend**, separating concerns across components, pages, state management, and utilities. 