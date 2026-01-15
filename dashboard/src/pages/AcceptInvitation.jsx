import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { UserCheck, Building2, Shield, AlertCircle } from "lucide-react";
import PasswordInput from "../components/PasswordInput";
import "../styles/Auth.css";

const API_URL = 'http://localhost:8081/api/v1/team';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link. Please request a new invitation.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/accept-invitation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 3000);
      } else {
        const err = await res.text();
        setError(err || "Failed to accept invitation");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card glass">
          <div className="success-icon">
            <UserCheck size={48} />
          </div>
          <h2 className="auth-title">Welcome to the Team!</h2>
          <p className="auth-subtitle">Your account has been created successfully.</p>
          <div className="success-message">
            <p>✅ Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card glass">
        <div className="invite-icon">
          <Building2 size={32} />
        </div>
        <h2 className="auth-title">Join Your Team</h2>
        <p className="auth-subtitle">Create your account to accept this invitation</p>

        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Password</label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              showStrength={true}
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              showStrength={false}
            />
          </div>

          <div className="invite-note">
            <Shield size={14} />
            <span>Your email has been pre-verified through this invitation</span>
          </div>

          <button 
            type="submit" 
            className="btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={isLoading || !token}
          >
            {isLoading ? "Creating Account..." : "Accept Invitation"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
