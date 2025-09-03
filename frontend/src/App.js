// App.js
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import ParentDashboard from "./pages/ParentDashboard";
import PsychologistDashboard from './pages/PsychologistDashboard'
import TeacherDashboard from "./pages/TeacherDashboard";
import AddQuestionnaire from "./components/AddQuestionnaire";
import ResponseTable from "./pages/ResponseTable"
import QuestionnaireBot from "./pages/QuestionnaireBot";
import QuestionnaireDetail from "./components/QuestionnaireDetail";
import { useSelector } from "react-redux"
import { Navigate } from "react-router-dom";

function App() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
  const role = useSelector((state) => state.auth.user.role);
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route 
            path="/parent-dashboard" 
            element={
              isAuthenticated && role === "Parent" ? 
                <ParentDashboard /> : 
                <Navigate to="/" replace />
            } 
          />
          
          <Route 
            path="/psychologist-dashboard" 
            element={
              isAuthenticated && role === "Psychologist" ? 
                <PsychologistDashboard /> : 
                <Navigate to="/" replace />
            } 
          />
          
          <Route 
            path="/teacher-dashboard" 
            element={
              isAuthenticated && role === "Teacher" ? 
                <TeacherDashboard /> : 
                <Navigate to="/" replace />
            } 
          />
          <Route path="/questionnaires" element={<AddQuestionnaire />} />
          <Route 
            path="/questionnaires" 
            element={
              isAuthenticated && role === "Psychologist" ? 
                <AddQuestionnaire /> : 
                <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/response-table" 
            element={
              isAuthenticated && role === "Psychologist" ? 
                <ResponseTable /> : 
                <Navigate to="/" replace />
            } 
          />
          <Route path="/questionnaire-bot" element={<QuestionnaireBot />} />
          <Route 
            path="/questionnaire-bot" 
            element={
              isAuthenticated && (role === "Parent" || role === "Teacher") ? 
                <QuestionnaireBot /> : 
                <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/questionnaire/:questionnaireName" 
            element={
              isAuthenticated && role === "Psychologist" ? 
                <QuestionnaireDetail /> : 
                <Navigate to="/" replace />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
