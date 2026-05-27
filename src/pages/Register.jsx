import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../Auth.css";
import { GoogleLogin } from "@react-oauth/google";
import { FaGithub, FaEye, FaEyeSlash } from "react-icons/fa";
import { loginWithGoogle, registerUser } from "../api/userApi.js";
import Logo from "../assets/cloudnest-logo.svg";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const Register = () => {

  const [formData, setFormData] = useState({
    name: "Nadim Khan",
    email: "khanm99098@gmail.com",
    password: "nad123",
  }); 

  const [serverError, setServerError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  
  const navigate = useNavigate();

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

 

  // Final form submit

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setIsSuccess(false);

    try {
      const data = await registerUser(formData);
        setIsSuccess(true);
        setTimeout(() => navigate("/"), 2000);
      }catch (error) {
      console.error(error);
      setServerError("Something went wrong. Please try again.");
    }
  };

  
  const loginWithGithub = () => {
  window.location.href = `${BASE_URL}/auth/github`;
  };
   
  
  return (
    <div className="auth-page auth-page--register">
      <div className="container register-container">
        <h2 className="heading">
          <span className="brand-mark">
            <img src={Logo} alt="CloudNest Logo" className="brand-logo" />
          </span>
          <span className="brand-copy">
            <span className="brand-title">CloudNest</span>
            <span className="brand-subtitle">Secure workspace access</span>
          </span>
        </h2>

        <form className="form" onSubmit={handleSubmit}>
        {/* Name */}
        <div className="form-group">
          <label htmlFor="name" className="label">
            Name
          </label>
          <input
            className="input"
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your name"
            required
          />
        </div>

        
        <div className="form-group">
          <label htmlFor="email" className="label">
            Email
          </label>
          
            <input
              className={`input ${serverError ? "input-error" : ""}`}
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
            
          
         
        </div>

        {/* Password */}
        <div className="form-group">
          <label htmlFor="password" className="label">
            Password
          </label>
          <div className="password-field">
            <input
              className="input password-input"
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className={`submit-button ${isSuccess ? "success" : ""}`}
          disabled={isSuccess}
        >
          {isSuccess ? "Registration Successful" : "Register"}
        </button>
        </form>

        <p className="link-text">
          Already have an account? <Link to="/login">Login</Link>
        </p>
        <div className="or">
          <span>Or</span>
        </div>
        <div className="google-login">
        <GoogleLogin
            width=""
            theme="filled_blue"
            text="continue_with"
            onSuccess={async (credentialResponse) => {
              const data=await loginWithGoogle(credentialResponse.credential);
              console.log("data",data)
              if(data.error){
                setServerError(data.error);
                return;
              }
              navigate("/")
            }}
            onError={() => {
              setServerError("Login with GoogleFailed");
            }}
            useOneTap


        />
        </div>
        <div className="github-login">
         <button className="github-btn" onClick={loginWithGithub}>
          <FaGithub size={18}  />
             Continue with GitHub
         </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
