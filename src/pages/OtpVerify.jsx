import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../Auth.css";
import Logo from "../assets/cloudnest-logo.svg";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const email=localStorage.getItem("otpEmail");

export default function OtpVerify() {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const inputsRef = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    let interval;
    if (countdown > 0) {
      interval = setInterval(() => setCountdown((c) => c - 1), 1000);
    } else if (countdown === 0 && resendDisabled) {
      setResendDisabled(false);
    }
    return () => clearInterval(interval);
  }, [countdown, resendDisabled]);

  const otp = digits.join("");

  const handleChange = (value, idx) => {
    if (!/^[0-9]?$/.test(value)) return;

    if (error) setError("");
    const next = [...digits];
    next[idx] = value;
    setDigits(next);

    if (value && idx < 3) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!pasted) return;

    e.preventDefault();
    const next = ["", "", "", ""];
    pasted.split("").forEach((char, idx) => {
      next[idx] = char;
    });
    setDigits(next);

    const focusIndex = Math.min(pasted.length, 3);
    inputsRef.current[focusIndex]?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (otp.length !== 4) {
      setError("Please enter the 4-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp, email}),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setSuccess("OTP verified. Redirecting...");
      setTimeout(() => navigate("/reset-password"), 800);
    } catch (err) {
      setError(err.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    setError("");
    setSuccess("");
    setResendLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error occurred while sending OTP.");
      }

      setSuccess(data.message || "OTP resent successfully.");
      setResendDisabled(true);
      setCountdown(30);
    } catch (err) {
      setError(err.message || "Error occurred while sending OTP.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-page auth-page--otp">
      <div className="login_container otp-card-theme">
        <h2 className="heading">
          <span className="brand-mark">
            <img src={Logo} alt="CloudNest Logo" className="brand-logo" />
          </span>
          <span className="brand-copy">
            <span className="brand-title">CloudNest</span>
            <span className="brand-subtitle">Secure verification</span>
          </span>
        </h2>

        <div className="otp-intro">
          <h3>Verify OTP</h3>
          <p>
            Enter the 4-digit code sent to <strong>{email}</strong>
          </p>
        </div>

        {error && <p className="otp-alert otp-alert--error">{error}</p>}
        {success && <p className="otp-alert otp-alert--success">{success}</p>}

        <form className="form" onSubmit={handleVerify}>
          <div className="otp-inputs" onPaste={handlePaste}>
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputsRef.current[idx] = el)}
                value={digit}
                onChange={(e) => handleChange(e.target.value, idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                maxLength={1}
                inputMode="numeric"
                className="otp-box"
                aria-label={`OTP digit ${idx + 1}`}
              />
            ))}
          </div>

          <button type="submit" disabled={loading || otp.length !== 4} className="submit-button otp-submit">
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <p className="otp-resend">
          Didn&apos;t receive the OTP?
          <button onClick={resendOTP} disabled={resendDisabled || resendLoading} type="button">
            {resendLoading ? "Resending..." : resendDisabled ? `Try again in ${countdown}s` : "Resend"}
          </button>
        </p>

        <p className="link-text otp-link-text">
          Wrong email? <Link to="/forgot-password">Go back</Link>
        </p>
      </div>
    </div>
  );
}
