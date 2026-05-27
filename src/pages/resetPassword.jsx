import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../Auth.css";
import Logo from "../assets/cloudnest-logo.svg";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const email = localStorage.getItem("otpEmail") || "your email";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password, email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Password reset failed");

      setSuccess("Password reset successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-page--reset">
      <div className="login_container reset-card-theme">
        <h2 className="heading">
          <span className="brand-mark">
            <img src={Logo} alt="CloudNest Logo" className="brand-logo" />
          </span>
          <span className="brand-copy">
            <span className="brand-title">CloudNest</span>
            <span className="brand-subtitle">Password recovery</span>
          </span>
        </h2>

        <div className="reset-intro">
          <h3>Reset Password</h3>
          <p>
            Create a new strong password for <strong>{email}</strong>
          </p>
        </div>

        {error && <p className="reset-alert reset-alert--error">{error}</p>}
        {success && <p className="reset-alert reset-alert--success">{success}</p>}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label className="label" htmlFor="new-password">
              New Password
            </label>
            <div className="password-field">
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input password-input"
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

          <div className="form-group">
            <label className="label" htmlFor="confirm-password">
              Confirm Password
            </label>
            <div className="password-field">
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input password-input"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                title={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="submit-button reset-submit">
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <p className="link-text">
          Back to <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
