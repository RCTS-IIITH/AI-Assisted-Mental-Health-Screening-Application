// TeacherDashboard.js
import React, { useState } from "react";
import Card from "./Card";
import "./TeacherDashboard.css";
import Navbar from "./Navbar";
import { useSelector, useDispatch } from "react-redux";
import { useFetchChildren } from "../hooks/FetchChildren";
import { setChildId, setQuestionnaireId } from "../redux/result_reducer";
import { useNavigate } from "react-router-dom";
import { useFetchQuestionnaireId } from "../hooks/FetchQuestionnaireId";

function TeacherDashboard() {
  // Redux state
  const userId = useSelector((state) => state.result.userId);
  const role = useSelector((state) => state.result.userType);
  const schoolName = useSelector((state) => state.result.schoolName);

  // Local state
  const [childrenUpdated, setChildrenUpdated] = useState(false); // Trigger refetch of children
  const [selectedChild, setSelectedChild] = useState(null); // Track selected child

  // Fetch children and questionnaire data
  const [{ isLoading, apiData: children = [], serverError }] = useFetchChildren(userId, role, schoolName, childrenUpdated);
  const [{ isLoading: isQuestionnaireLoading, apiData: questionnaireData, serverError: questionnaireError }] = useFetchQuestionnaireId(role);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Handle "Take Test" button click
  const handleTakeTest = async () => {
    if (selectedChild && questionnaireData?.questionnaire_id) {
      console.log("Selected Child:", selectedChild);
      console.log("Questionnaire Data:", questionnaireData);

      dispatch(setQuestionnaireId(questionnaireData.questionnaire_id));
      dispatch(setChildId(selectedChild));
      navigate("/questions");
    } else {
      console.error("Error: Missing Questionnaire ID or Selected Child");
      alert("Questionnaire ID or Selected Child is not available.");
    }
  };

  // Handle "Back" button click
  const handleBack = () => {
    navigate(-1); // Navigate to the previous page
  };

  // Render loading or error states
  if (isLoading) return <h3 className="text-light">Loading...</h3>;
  if (serverError) return <h3 className="text-light">Error: {serverError || "Unable to fetch children"}</h3>;

  return (
    <div className="TD-page-container">
      <Navbar />
      <div className="Outside-TD">
        <div className="button_and_card_container-TD">
          <p className="Role-Select-TD2">
            {Array.isArray(children) && children.length > 0
              ? "On whose behalf you want to give the test?"
              : "No children registered in school"}
          </p>
          <div className="Parent-Dashboard-card-container-PD">
            {Array.isArray(children) && children.length > 0 ? (
              children.map((child) => (
                <Card
                  key={child._id || Math.random()} // Fallback key
                  role={child.Name || "Unknown Name"}
                  statement={`${child.School || "Unknown School"} - Age: ${child.Age || "N/A"}`}
                  isSelected={selectedChild === child._id}
                  onSelect={() => setSelectedChild(child._id)}
                />
              ))
            ) : (
              <div style={{ height: "10vh" }}></div>
            )}
          </div>

          {/* Take Test Button */}
          <div className="two-buttons-TD">
            {selectedChild && (
              <button
                className="add-child-btn-TD"
                onClick={handleTakeTest}
                disabled={isQuestionnaireLoading}
              >
                {isQuestionnaireLoading ? "Loading..." : "Take Test"}
              </button>
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="back-button-container">
          <button className="back-btn" onClick={handleBack}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;
