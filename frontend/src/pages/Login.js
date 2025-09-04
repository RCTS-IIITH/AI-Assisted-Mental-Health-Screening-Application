import React, { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { useDispatch } from "react-redux";
import { loginStart, loginSuccess, loginFailure} from "../redux/authSlice";
import { useNavigate } from "react-router-dom";

const roles = ["Parent", "Teacher", "Psychologist"];
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Login = () => {
  const [mode, setMode] = useState("login"); // login | signup | forgot | otp
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [role, setRole] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(60);
  const [otpSent, setOtpSent] = useState(false);
  const [verification, setVerification] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Timer for OTP resend
  React.useEffect(() => {
    let interval;
    if (mode === "otp" && otpSent && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [mode, otpSent, timer]);

  // Handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!mobile || !password) {
      toast.error("Please enter mobile number and password");
      return;
    }
    try {
      dispatch(loginStart());

      const res = await axios.post(`${BACKEND_URL}/api/auth/login`, { mobile, password });

      if (res.status === 200) {
        const { access_token, token_type, user, expires_in, message } = res.data;
        
        localStorage.setItem('token', access_token);
        localStorage.setItem('tokenType', token_type);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('expiresIn', expires_in);

        dispatch(loginSuccess({
          token: access_token,
          tokenType: token_type,
          user: user,
          expiresIn: expires_in,
        }));
        
        toast.success(message);
        if(user.role === "Teacher") 
          navigate('/teacher-dashboard')
        else if(user.role === "Parent")
          navigate('/parent-dashboard')
        else if(user.role === "Psychologist")
          navigate('/psychologist-dashboard')
      }
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = "Login failed. Please try again.";
      
      if (error.response?.status === 401) {
        errorMessage = "Invalid credentials";
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      dispatch(loginFailure(errorMessage));
      toast.error(errorMessage);
    }
  };


  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name || !role || !mobile || !password || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }
    if(role === "Teacher" && !school){
      toast.error("Please enter school");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      const data = {
        role,
        name,
        school: role === "Teacher" ? school : null,
        mobile,
        password,
        otp
      }
      const res = await axios.post(`${BACKEND_URL}/api/auth/signup`, data);

      if (res.status === 200) {
        const { message } = res.data;
        
        toast.success(message);
        setOtpSent(false);
        setTimer(60);
        setMode("login");
      }
    } catch (error) {
      console.error('Signup error:', error);
      
      let errorMessage = "Signup failed. Please try again.";
      
      dispatch(loginFailure(errorMessage));
      toast.error(errorMessage);
    }
  };
  

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!mobile) {
      toast.error("Please enter your mobile number");
      return;
    }
    try{
      const res = await axios.post(`${BACKEND_URL}/api/auth/send-otp`, { mobile });

      if (res.status === 200) {
        const { message } = res.data;
        toast.success(message);
        setOtpSent(true);
        setOtp("");
        setTimer(60);
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      let errorMessage = "Failed to send OTP. Please try again.";
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      toast.error(errorMessage);
    }
  };
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!mobile || !password || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try{
      const res = await axios.post(`${BACKEND_URL}/api/auth/change-password`, { mobile, password });

      if (res.status === 200) {
        const { message } = res.data;
        toast.success(message);
        setVerification(false);
        setMode("login");
      }
    } catch (error) {
      console.error('Change Password error:', error);
      let errorMessage = "Failed to change password. Please try again.";
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      toast.error(errorMessage);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!mobile || !otp) {
      toast.error("Enter Details");
      return;
    }
    try{
      const res = await axios.post(`${BACKEND_URL}/api/auth/verify-otp`, { mobile, otp});

      if (res.status === 200) {
        const { message } = res.data;
        toast.success(message);
        setOtpSent(false);
        setOtp("");
        setTimer(60);
        setVerification(true);
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      let errorMessage = "Failed to send OTP. Please try again.";
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      toast.error(errorMessage);
    }
  };

  const handleResendOtp = () => {
    if (timer > 0) return;
    // Call /api/auth/send-otp
    toast.success("OTP resent!");
    setTimer(60);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <ToastContainer />
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {mode === "login" && "Login"}
          {mode === "signup" && "Sign Up"}
          {mode === "forgot" && "Forgot Password"}
          {mode === "otp" && "Verify OTP"}
        </h2>

        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              placeholder="Mobile Number"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              Login
            </button>
            <div className="flex justify-between mt-2">
              <div className="flex flex-cols">
                <p>Already have an account?</p>
                <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={() => setMode("signup")}
              >
                Sign Up
              </button>
              </div>
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={() => setMode("forgot")}
              >
                Forgot Password?
              </button>
            </div>
          </form>
        )}
        {mode === "signup" && (
          <form onSubmit={handleSignup} className="space-y-4">
            <select
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">Select Role</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Name"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {role === "Teacher"?
            <input
              type="text"
              placeholder="School"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
            />:null}
            <input
              type="text"
              placeholder="Mobile Number"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {otpSent && <input
              type="text"
              placeholder="Enter OTP"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />}
            {otpSent ?<button
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition" onClick={handleSignup}
            >
              Verify & Sign Up
            </button> : <button
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition" onClick={handleSendOTP}
            >
              Send OTP
            </button>}
            
            <div className="flex justify-center mt-2">
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={() => setMode("login")}
              >
                Back to Login
              </button>
            </div>
          </form>
        )}

        {mode === "forgot" && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <input
              type="text"
              placeholder="Mobile Number"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
            {otpSent && <input
                type="text"
                placeholder="Enter OTP"
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
            />}
            {(!verification && otpSent) && <button
              className="w-full bg-yellow-600 text-white py-2 rounded hover:bg-yellow-700 transition" onClick={handleVerifyOtp}
            >
              Verify OTP
            </button>}
            {(!verification && !otpSent) && <button
              className="w-full bg-yellow-600 text-white py-2 rounded hover:bg-yellow-700 transition" onClick={handleSendOTP}
            >
              Send OTP
            </button>}
            { verification && <div> 
              <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
              <button
              type="submit"
              className="w-full bg-yellow-600 text-white py-2 rounded hover:bg-yellow-700 transition"
            >
              Change Password
            </button>
            </div>
            }
            
            <div className="flex justify-center mt-2">
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={() => setMode("login")}
              >
                Back to Login
              </button>
            </div>
          </form>
        )}

        {mode === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <input
              type="text"
              placeholder="Enter OTP"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition"
            >
              Verify OTP
            </button>
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-600">
                {timer > 0
                  ? `Resend OTP in ${timer}s`
                  : (
                    <button
                      type="button"
                      className="text-blue-600 hover:underline"
                      onClick={handleResendOtp}
                    >
                      Resend OTP
                    </button>
                  )
                }
              </span>
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={() => setMode("login")}
              >
                Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;