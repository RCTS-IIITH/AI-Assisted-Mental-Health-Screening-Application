import React, { useState } from "react";
import Card from "./Card";
import "./ParentDashboard.css";
import Navbar from "./Navbar";
import { useSelector, useDispatch } from "react-redux";
import { useFetchChildren } from "../hooks/FetchChildren";
import { setChildId, setQuestionnaireId, setUserType } from "../redux/result_reducer";
import { useNavigate } from "react-router-dom";
import { useFetchQuestionnaireId } from "../hooks/FetchQuestionnaireId";
import { useAddChild } from "../hooks/addChild";


function ParentDashboard() {
  // retrieve redux values
  const userId = useSelector(state => state.result.userId);
  const role = useSelector(state => state.result.userType);
  const schoolName = useSelector(state => state.result.schoolName);

  // childrenUpdated is used to re-fetch the list of children when the handleAddChild function successfully adds a new child
  const [childrenUpdated, setChildrenUpdated] = useState(false);
  // selectedChild holds the child id of the selected child
  const [selectedChild, setselectedChild] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

  const [{ isLoading, apiData: children = [], serverError }] = useFetchChildren(userId, role, schoolName, childrenUpdated);
  const [{ isLoading: isQuestionnaireLoading, apiData: questionnaireData, serverError: questionnaireError }] = useFetchQuestionnaireId(role);

  // role may change from parent to child
  const dispatch = useDispatch();
  const navigate = useNavigate();


  const [newChild, setNewChild] = useState({ name: "", school: "", age: "" });
  const { addChild, isPosting, error } = useAddChild();
  const parent_id = useSelector(state => state.result.userId);

  // Handle adding a new child
  const handleAddChild = async () => {
    console.log("Adding child:", newChild, parent_id); // Debugging log
    if (newChild.name && newChild.school && newChild.age) {
      try {
        const response = await addChild(newChild.name, newChild.school, newChild.age, parent_id);
        console.log("Add child response:", response); // Log successful response

        setChildrenUpdated(prev => !prev);
        setNewChild({ name: "", school: "", age: "" });
        setIsFormVisible(false);
      } catch (err) {
        console.error("Error adding child:", err.message);
        alert(err.message || "Failed to add child");
      }
    } else {
      alert("All fields are required!");
    }
  };

  // Handle clicking on the "Take Test" button
  const handleTakeTest = async () => {
    if (selectedChild) {
      console.log(`Selected Child: ${selectedChild}`);
      console.log(`Selected Role: ${role}`);
      dispatch(setQuestionnaireId(questionnaireData.questionnaire_id));
      dispatch(setChildId(selectedChild));
      console.log(`Fetched Questionnaire ID: ${questionnaireData.questionnaire_id}`);

      if (isQuestionnaireLoading) return <h3 className='text-light'>isLoading</h3>;
      if (questionnaireError) return <h3 className='text-light'>{serverError || "Unknown Error"}</h3>;
      navigate("/questions");
    }
  };

  // Handle toggling the role between Parent and Child
  const handleRoleToggle = () => {
    const newRole = role === "parent" ? "child" : "parent";
    dispatch(setUserType(newRole));
  };

  // console.log("l55 ParentDashboard.js children = ", children);

  if (isLoading) return <h3 className='text-light'>isLoading</h3>;
  if (serverError) return <h3 className='text-light'>{serverError || "Unknown Error"}</h3>;
  return (
    <div className="PD-page-container">
      <Navbar />
      <div className="Outside-PD">
        <div className="Role-Select-Div-PD">
          <p className="Role-Select-PD">Who is giving the test?</p>
          <div className="role-toggle-container-PD">
            <span className="PDrole-label left">Parent</span>
            <label className="switch-PD">
              <input
                type="checkbox"
                checked={role === "child"}
                onChange={handleRoleToggle}
              />
              <span className="slider-PD"></span>
            </label>
            <span className="PDrole-label right">Child</span>
          </div>
        </div>
        <div className="button_and_card_container-PD">
          <p className="Role-Select-PD2">
            {role === "parent"
              ? "On whose behalf you want to give the test?"
              : "Select Your Name"}
          </p>
          <div className="Parent-Dashboard-card-container-PD">
            {/* Ensure children is an array before calling .map */}
            {Array.isArray(children) && children.length > 0 ? (
              children.map((child) => (
                <Card
                  key={child._id}
                  role={child.Name}
                  statement={`${child.School} - Age: ${child.Age}`}
                  isSelected={selectedChild === child._id}
                  onSelect={() => setselectedChild(child._id)}
                />
              ))
            ) : (
              <div style={{ height: '10vh' }}></div>
            )}
          </div>

          {/* Add Child Button */}
          <div className="two-buttons-PD">
            <button
              className="add-child-btn-PD"
              onClick={() => setIsFormVisible(true)}
            >
              Add Child
            </button>

            {/* Only display Take Test button when a child is selected */}
            {selectedChild && (
              <button className="add-child-btn-PD" onClick={handleTakeTest}>
                Take Test
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {isFormVisible && (
        <div className="form-modal-PD">
          <div className="form-container-PD">
            <h2>Add Child</h2>
            <label>
              Child Name:
              <input
                type="text"
                value={newChild.name}
                onChange={(e) =>
                  setNewChild({ ...newChild, name: e.target.value })
                }
              />
            </label>
            <label>
              School Name:
              <input
                type="text"
                value={newChild.school}
                onChange={(e) =>
                  setNewChild({ ...newChild, school: e.target.value })
                }
              />
            </label>
            <label>
              Age:
              <input
                type="number"
                value={newChild.age}
                onChange={(e) =>
                  setNewChild({ ...newChild, age: e.target.value })
                }
              />
            </label>
            <div className="form-buttons-PD">
              <button
                onClick={handleAddChild}
                disabled={!newChild.name || !newChild.school || !newChild.age}
              >Add</button>
              <button onClick={() => setIsFormVisible(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ParentDashboard;
