import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "../styles/Auth.css";

const API_URL = 'http://localhost:8081/api/v1/auth';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    // Call verification API
    const verifyEmail = async () => {
      try {
        const response = await fetch(`${API_URL}/verify-email?token=${token}`);
        
        if (response.ok) {
          setStatus("success");
          setMessage("Your email has been verified successfully!");
        } else {
          const errText = await response.text();
          setStatus("error");
          setMessage(errText || "Verification failed. The link may have expired.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Network error. Please try again.");
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Email Verification</h1>
        </div>

        {status === "verifying" && (
          <div className="loading-message">
            <p>⏳ Verifying your email...</p>
          </div>
        )}

        {status === "success" && (
          <div className="success-message">
            <p>✅ {message}</p>
            <p>You can now access all features.</p>
          </div>
        )}

        {status === "error" && (
          <div className="error-message">
            <p>❌ {message}</p>
          </div>
        )}

        <Link to="/login" className="btn-primary" style={{ display: 'block', textAlign: 'center', marginTop: '1.5rem' }}>
          Go to Login
        </Link>
      </div>
    </div>
  );
}
