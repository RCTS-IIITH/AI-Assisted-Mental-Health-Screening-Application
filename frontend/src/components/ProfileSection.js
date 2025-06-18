import React from 'react';

const ProfileSection = ({ childData }) => {
  return (
    <div className="profile-section">
      <h1>Summary</h1>
      <h3>Profile:</h3>
      <ul>
        <li><strong>Age:</strong> {childData.age}</li>
        <li><strong>Parent Name:</strong> {childData.parent_name}</li>
        <li><strong>Diagnosis:</strong> {childData.diagnosis}</li>
      </ul>
    </div>
  );
};

export default ProfileSection;

