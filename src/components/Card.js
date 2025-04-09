import React from 'react';
import './Card.css';
function Card({ role, statement, isSelected, onSelect }) {
  return (
    <div
      className={`card ${isSelected ? 'card-selected' : ''}`}
      onClick={onSelect}
    >
      <h3>{role}</h3>
      <p>{statement}</p>
    </div>
  );
}

export default Card;
