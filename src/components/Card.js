import React from 'react';
import './Card.css';

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

export default Card;