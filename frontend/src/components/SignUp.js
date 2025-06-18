import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import './LoginSignUp.css';
import Navbar from "./Navbar";
// import axios from 'axios';

function SignUp() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [schoolName, setSchoolName] = useState(""); // New state for school name
  const [error, setError] = useState(null); // State for errors
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Create user data to be sent to the API
    const userData = {
      name,
      age,
      role,
      phone,
      schoolName: role === "Teacher" ? schoolName : undefined, // Include schoolName if role is Teacher
    };

    try {
      // Send POST request to the signup API
      const response = await fetch("http://127.0.0.1:5000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to the login page after successful signup
        navigate("/");
      } else {
        // Display error if signup fails
        setError(data.error || "Signup failed. Please try again.");
      }
    } catch (error) {
      console.error("Error signing up:", error);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="container-LogInSignup">
      <Navbar />
      <div className="Outside-Form-SignUp">
        <div className="form-container-SignUp">
          <div className="Heading-Sign">Create An Account</div>
          {/* Display error message if any */}
          {error && <p className="error-message">{error}</p>}
          <form onSubmit={handleSubmit}>
            <input
              className="SignUp-Input"
              type="text"
              placeholder="Enter Your Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="number"
              className="SignUp-Input"
              placeholder="Enter Your Age"
              required
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
            <select
              className="SignUp-Input"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">Select Your Role</option>
              <option value="Parent">Parent</option>
              <option value="Psychologist">Psychologist</option>
              <option value="Teacher">Teacher</option>
            </select>

            {role === "Teacher" && ( // Conditionally render school name input
              <input
                type="text"
                className="SignUp-Input"
                placeholder="Enter School Name"
                required
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
              />
            )}

            <input
              type="tel"
              className="SignUp-Input"
              placeholder="Enter Your Phone Number"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <button type="submit" className="btn-Sign">Sign Up</button>
            <p className="signup-p">
              Already have an account? <Link to="/">Login</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
