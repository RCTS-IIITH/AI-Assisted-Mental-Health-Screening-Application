import React from "react";
import "./OTPComp.css";
import Navbar from "./Navbar";
import { Link } from "react-router-dom";

function SubmitOtpComp() {
  return (
    <div className="container-OTP">
     <Navbar/>
      <div className="Outside-Form-Reset">
        <div className="form-container-Reset">
          <div className="Heading-Reset">Submit OTP</div>
          <div className="Below-Reset">
            Please enter the OTP that has been sent to you
          </div>
          <form>
            <input
              type="otp"
              className="Reset-Inp"
              placeholder="Enter OTP"
              required
            />
            <button type="submit" className="btn-Reset">
              Submit
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SubmitOtpComp;
