// PsychologistDashboard.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from './Card';
import './PsychologistDashboard.css';
import Navbar from './Navbar';

function PsychologistDashboard() {
  const [selectedRole, setSelectedRole] = useState('Student');
  const navigate = useNavigate();

  const handleCardSelect = (role) => {
    setSelectedRole(role);
    if (role === 'Add Question') {
      navigate('/questionnaires');  // Redirect to Add Question page
    }
    // else if (role === 'View Responses') {
    //   navigate('/responses');  // Redirect to View Responses page
    // }

    setSelectedRole(role);
    if (role === 'View Responses') {
      navigate('/response-table');  // Redirect to Add Question page
    }
  };

  return (
    <div className="PsychoD-container">
      <Navbar />
      <div className="Outside">
        <div className="Welcome-P">Welcome! </div>
        <div className="main-container-PsychoDash">
            <Card
              role="User Responses"
              statement="View the responses for all students"
              isSelected={selectedRole === 'View Responses'}
              onSelect={() => handleCardSelect('View Responses')}
            />
            <Card
              role="Questions"
              statement="View all the questionnaires"
              isSelected={selectedRole === 'Add Question'}
              onSelect={() => handleCardSelect('Add Question')}
            />
        </div>
      </div>
    </div>
  );
}

export default PsychologistDashboard;
