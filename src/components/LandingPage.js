import React, { useState } from 'react';
import './LandingPage.css';
import Navbar from './Navbar';

const Card = ({ role, statement, icon, isSelected, onSelect }) => (
  <div 
    className={`role-card ${isSelected ? 'selected' : ''}`}
    onClick={onSelect}
  >
    <div className="role-icon">{icon}</div>
    <h3>{role}</h3>
    <p>{statement}</p>
    <button className="select-button">
      {isSelected ? 'Selected' : 'Select'}
    </button>
  </div>
);

function LandingPage() {
  const [selectedRole, setSelectedRole] = useState('Student');

  return (
    <div className="landing-page-container">
      <Navbar />
      
      <div className="hero">
        <h1>Interactive Learning Experience</h1>
        <p>Choose your role to access personalized educational content and tools designed specifically for your needs.</p>
      </div>
      
      <div className="role-selection">
        <h2>Select Your Role</h2>
        <div className="card-container-LP">
          <Card
            role="Student"
            statement="Engage with our AI tutor designed for students aged 11+ with personalized learning paths."
            icon="🎓"
            isSelected={selectedRole === 'Student'}
            onSelect={() => setSelectedRole('Student')}
          />
          <Card
            role="Parent"
            statement="Monitor and assist your child's learning journey with parental controls and insights."
            icon="👪"
            isSelected={selectedRole === 'Parent'}
            onSelect={() => setSelectedRole('Parent')}
          />
          <Card
            role="Teacher"
            statement="Access classroom tools and manage multiple student profiles with educator features."
            icon="📚"
            isSelected={selectedRole === 'Teacher'}
            onSelect={() => setSelectedRole('Teacher')}
          />
        </div>
      </div>
    </div>
  );
}

export default LandingPage;