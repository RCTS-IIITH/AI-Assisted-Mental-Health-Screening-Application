import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import './LoginSignUp.css';
import Navbar from "./Navbar";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setSchoolName, setUserId, setUserType } from '../redux/result_reducer'
// import { useCookies } from 'react-cookie';

function Login() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const validatePhoneNumber = (number) => {
    // Basic phone number validation - can be adjusted based on your needs
    const phoneRegex = /^\d{10}$/;  // Matches exactly 10 digits
    return phoneRegex.test(number);
  };

  const handlePhoneNumberChange = (e) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^\d]/g, '');
    setPhoneNumber(value);
  };

  const dispatch = useDispatch();


  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validatePhoneNumber(phoneNumber)) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    try {
      // Call your backend login route to check phone number
      const response = await axios.post("http://127.0.0.1:5000/login", { phone: phoneNumber });

      // Check if the response has a token and role
      if (response.data.token) {
        // Store the token in localStorage (or context for better state management)
        localStorage.setItem("token", response.data.token);
        const user_id = response.data._id;
        const role = response.data.role.toLowerCase().trim();
        console.log("l47 role = |", role);
        console.log("length is ", role.length);

        // redux
        dispatch(setUserId(user_id));
        dispatch(setUserType(role));

        // update schoolName if teacher is using
        if (role == "teacher") {
          console.log("l56 Login.js response = ", response);
          const schoolName = response.data.school;
          dispatch(setSchoolName(schoolName));
          console.log("l58 Login.js schoolName = ", schoolName);
        }

        // Handle role-based navigation
        switch (role) {
          case "parent":
            navigate("/parent-dashboard");
            break;
          case "psychologist":
            navigate("/psychologist-dashboard");
            break;
          case "teacher":
            navigate("/teacher-dashboard");
            break;
          default:
            setError("Role not recognized");
            break;
        }
      } else {
        setError("Login failed. Please try again.");
      }
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="container-LogInSignup">
      <Navbar />
      <div className="Outside-Form-LogIn">
        <div className="form-container-LogIn">
          <div className="Heading-Log">Welcome Back</div>
          <p className="Below-Heading">Please Enter Your Details</p>
          {error && <p className="error-message">{error}</p>}
          <form className="LogIn-Form" onSubmit={handleLogin}>
            <div className="form-group-LogIn">
              <label htmlFor="phoneNumber" className="form-label-Login">Phone Number</label>
              <input
                type="tel"
                className="LogIn-Input-Ph"
                id="phoneNumber"
                placeholder="Enter 10-digit number"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                maxLength={10}
                required
              />
            </div>
            <button type="submit" className="btn">Login</button>
            <p className="signup-p">Don't have an account? <Link to="/signup">Sign up</Link></p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
