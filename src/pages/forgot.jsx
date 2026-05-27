import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../Auth.css";
import Logo from "../assets/cloudnest-logo.svg";

const BASE_URL=import.meta.env.VITE_BASE_URL;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage(data.message || "OTP sent successfully.");
        localStorage.setItem("otpEmail", email);
        setTimeout(() => navigate("/otpverify"), 500);
      } else {
        setError(data.message || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Unable to send OTP right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-page--forgot">
      <div className="login_container forgot-card-theme">
        <h2 className="heading">
          <span className="brand-mark">
            <img src={Logo} alt="CloudNest Logo" className="brand-logo" />
          </span>
          <span className="brand-copy">
            <span className="brand-title">CloudNest</span>
            <span className="brand-subtitle">Account recovery</span>
          </span>
        </h2>

        <div className="forgot-intro">
          <h3 className="text-2xl font-semibold text-gray-800">Forgot your password?</h3>
          <p>Enter your account email and we will send a one-time OTP code.</p>
        </div>

        {error && <p className="forgot-alert forgot-alert--error">{error}</p>}
        {message && <p className="forgot-alert forgot-alert--success">{message}</p>}

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label" htmlFor="forgot-email">
              Email
            </label>
            <input
              id="forgot-email"
              className="input"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>{if(error){setError("")};setEmail(e.target.value)}}
              required
            />
          </div>

          <button className="submit-button forgot-submit" type="submit" disabled={loading}>
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>

        <p className="link-text">
          Remembered your password? <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
