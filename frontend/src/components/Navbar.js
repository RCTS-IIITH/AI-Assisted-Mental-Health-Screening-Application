import React, { useEffect } from "react";
import './Navbar.css';
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setUserId, setUserType } from '../redux/result_reducer';


function Navbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Access Redux state
  const userId = useSelector((state) => state.result.userId);
  const userType = useSelector((state) => state.result.userType);

  // Log Redux state whenever it changes
  useEffect(() => {
    console.log("Redux State After Logout:");
    console.log("User ID:", userId);
    console.log("User Type:", userType);
  }, [userId, userType]); // Dependencies ensure logs are updated after state changes

  const handleLogout = () => {
    // Clear token and other user-related data from localStorage
    localStorage.removeItem("token");

    // Reset Redux state
    dispatch(setUserId(null)); // Reset userId
    dispatch(setUserType(null)); // Reset userType

    // Redirect to login page
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-img" onClick={handleLogout} title="Logout">
        <img alt="logout-icon" src="logout.svg" />
      </div>
    </nav>
  );
}

export default Navbar;
