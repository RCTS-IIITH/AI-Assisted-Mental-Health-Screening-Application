import React, { useState } from 'react';
import Card from './Card';
import './LandingPage.css';
import Navbar from './Navbar';
function LandingPage() {
  const [selectedRole, setSelectedRole] = useState('Student');

  return (
    <div className="landing-page-container">
      <Navbar/>
      <div className='Outside-LP'>
      <div className="card-container-LP">
        <Card
          role="Student"
          statement="Students older than 11 years of age can chat with the bot here"
          isSelected={selectedRole === 'Student'}
          onSelect={() => setSelectedRole('Student')}
        />
        <Card
          role="Parent"
          statement="The parents can chat on behalf of their child of all ages"
          isSelected={selectedRole === 'Parent'}
          onSelect={() => setSelectedRole('Parent')}
        />
        <Card
          role="Teacher"
          statement="The teacher can chat on behalf of all their pupils of all ages"
          isSelected={selectedRole === 'Teacher'}
          onSelect={() => setSelectedRole('Teacher')}
        />
      </div>
      </div>
    </div>
  );
}

export default LandingPage;
