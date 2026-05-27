import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../Auth.css";
import { GoogleLogin } from "@react-oauth/google";
import { loginWithGoogle } from "../api/userApi.js";
import { FaGithub, FaEye, FaEyeSlash } from "react-icons/fa";
import Logo from "../assets/cloudnest-logo.svg";
import { useAuth } from "../context/authContext.jsx";
import { loginUser } from "../api/userApi.js";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const Login = () => {
  const { currentUser, authLoading, fetchCurrentUser } = useAuth();
  const [formData, setFormData] = useState({
    email: "khanm99098@gmail.com",
    password: "nad123",
  });
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && currentUser) {
      navigate("/", { replace: true });
    }
  }, [authLoading, currentUser, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (serverError) {
      setServerError("");
    }

    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data=await loginUser(formData);
      console.log(data);
      if(data.message){
        localStorage.setItem("otpEmail", formData.email);
        await fetchCurrentUser();
        navigate("/");
      }
    } catch (error) {
      console.error("Error:", error);
      setServerError("Something went wrong. Please try again.");
    }
  };

  const loginWithGithub = () => {
    window.location.href = `${BASE_URL}/auth/github`;
  };

  const hasError = Boolean(serverError);

  return (
    <div className="auth-page auth-page--login">
      <div className="login_container">
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
          <div className="form-group">
            <label htmlFor="email" className="label">
              Email
            </label>
            <input
              className={`input ${hasError ? "input-error" : ""}`}
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="label">
              Password
            </label>
            <div className="password-field">
              <input
                className={`input password-input ${hasError ? "input-error" : ""}`}
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
            {serverError && <span className="error-msg">{serverError}</span>}
          </div>
          <Link className="text-sm text-blue-500" to="/forgot-password">
            Forgot Password
          </Link>

          <button type="submit" className="submit-button">
            Login
          </button>
        </form>

        <p className="link-text">
          Don't have an account? <Link to="/register">Register</Link>
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
              const data = await loginWithGoogle(credentialResponse.credential);
              if (data.error) {
                setServerError(data.error);
                return;
              }
              await fetchCurrentUser();
              navigate("/", { replace: true });
            }}
            onError={() => {
              setServerError("Login with GoogleFailed");
            }}
            useOneTap
          />
        </div>
        <div className="github-login">
          <button className="github-btn" onClick={loginWithGithub}>
            <FaGithub size={18} />
            Continue with GitHub
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
