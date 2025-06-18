import React from 'react';
import CircularProgress from './CircularProgress';
import { FaUserCircle } from 'react-icons/fa';

const PerformanceCard = ({ childData }) => {
  return (
    <div className="performance-card">
      <div className="profile-picture">
        <FaUserCircle size={150} color="#d3d3d3" />
      </div>
      <h2>{childData.name}</h2>
    </div>
  );
};

export default PerformanceCard;
