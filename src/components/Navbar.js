import React, { useEffect } from "react";
import './Navbar.css';
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setUserId, setUserType } from '../redux/result_reducer';

function Navbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const userId = useSelector((state) => state.result.userId);
  const userType = useSelector((state) => state.result.userType);

  useEffect(() => {
    console.log("Redux State After Logout:");
    console.log("User ID:", userId);
    console.log("User Type:", userType);
  }, [userId, userType]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    dispatch(setUserId(null));
    dispatch(setUserType(null));
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand" onClick={() => navigate('/')}>
          <span>EduAI</span>
        </div>
        <div className="navbar-actions">
          {userId && (
            <div className="user-info">
              <span className="user-type">{userType}</span>
              <span className="user-id">ID: {userId}</span>
            </div>
          )}
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;