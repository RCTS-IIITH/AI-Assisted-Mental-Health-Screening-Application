import React, { useState } from "react";
import "./OTPComp";
import Navbar from "./Navbar";
function ResetPass() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisible(!confirmPasswordVisible);
  };

  return (
    <div className="container">
     <Navbar/>
      <div className="Outside-Form-Reset">
        <div className="form-container-Reset">
          <div className="Heading-Reset">Reset Your Password</div>
          <div className="Below-Reset">Please Enter your New Password</div>
          <form>
            <input
              type="email"
              className="Reset-Inp"
              placeholder="Enter Your Email"
              required
            />

            <div className="password-container-R">
              <input
                className="Reset-Inp"
                type={passwordVisible ? "text" : "password"}
                placeholder="Enter Your Password"
                required
              />
              <button
                type="button"
                className="toggle-password-R"
                onClick={togglePasswordVisibility}
              >
                {passwordVisible ? "🙈" : "👁️"}
              </button>
            </div>

            <div className="password-container-R">
              <input
                type={confirmPasswordVisible ? "text" : "password"}
                placeholder="Confirm Password"
                required
                className="Reset-Inp"
              />
              <button
                type="button"
                className="toggle-password-R"
                onClick={toggleConfirmPasswordVisibility}
              >
                {confirmPasswordVisible ? "🙈" : "👁️"}
              </button>
            </div>

            <button type="submit" className="btn-Reset">
              Reset Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ResetPass;
