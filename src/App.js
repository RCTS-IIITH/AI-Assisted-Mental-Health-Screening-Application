// App.js
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import SignUp from "./components/SignUp";
import Login from "./components/Login";
import ChildDashboard from "./components/ChildDashboard";
import ParentDashboard from "./components/ParentDashboard";
import PsychologistDashboard from './components/PsychologistDashboard'
import TeacherDashboard from "./components/TeacherDashboard";
import ViewResponse from "./components/ViewResponse";
import ThankYou from "./components/ThankYou";
import LandingPage from "./components/LandingPage";
import AddQuestionnaire from "./components/AddQuestionnaire";
import QuestionForm from "./components/AddQuestion";
import QuestionsPage from "./components/QuestionsPage";
import ResponseTable from "./components/ResponseTable"
import QuestionnaireView from "./components/SubQuestionnaire";
import SubQuestionnaireView from "./components/ParticularTag"
import SubmitOtpComp from "./components/OTPComp";
import FileUpload from "./components/FileUpload";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/child-dashboard" element={<ChildDashboard />} />
          <Route path="/parent-dashboard" element={<ParentDashboard />} />
          <Route path="/psychologist-dashboard" element={<PsychologistDashboard />} />
          <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
          {/* <Route path="/view-response" element={<ViewResponse />} /> */}
          <Route path="/view-response/:id" element={<ViewResponse />} />
          <Route path="/file-upload" element={<FileUpload />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/landing-page" element={<LandingPage />} />
          <Route path="/submit_otp" element={<SubmitOtpComp />} />
          <Route path="/questionnaires" element={<AddQuestionnaire />} />
          <Route path="/questionnaire/:questionnaireId/add-question" element={<QuestionForm />} />
          <Route path="/questions" element={<QuestionsPage />} />
          <Route path="/questionnaire/:id" element={<QuestionnaireView />} />
          <Route path="/response-table" element={<ResponseTable />} />
          <Route path="/questionnaire/:id/subquestionnaire/:tag" element={<SubQuestionnaireView />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
