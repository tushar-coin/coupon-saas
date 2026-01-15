import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Auth.css";

const API_URL = 'http://localhost:8081/api/v1/auth';

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, org_name: orgName }),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const errText = await response.text();
        setError(errText || "Something went wrong");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Check Your Email</h1>
            <p>If an account exists with this email, we've sent password reset instructions.</p>
          </div>
          
          <div className="success-message">
            <p>📧 Check your inbox (and spam folder)</p>
            <p>The reset link expires in 15 minutes.</p>
          </div>

          <Link to="/login" className="btn-primary" style={{ display: 'block', textAlign: 'center', marginTop: '1rem' }}>
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Forgot Password</h1>
          <p>Enter your email and organization to receive a reset link</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="orgName">Organization Name</label>
            <input
              id="orgName"
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Enter your organization"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="auth-footer">
          <p>Remember your password? <Link to="/login">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
}
