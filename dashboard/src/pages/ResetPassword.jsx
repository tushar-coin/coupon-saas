import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, CheckCircle } from "lucide-react";
import ReceiptLayout from "../components/auth/ReceiptLayout";
import { API_AUTH } from '../config/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link. Please request a new password reset.");
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
      const response = await fetch(`${API_AUTH}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 3000);
      } else {
        const errText = await response.text();
        setError(errText || "Reset failed. The link may have expired.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <ReceiptLayout>
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#D1FAE5',
            marginBottom: '1rem'
          }}>
            <CheckCircle size={24} style={{ color: '#059669' }} />
          </div>
          
          <h3 style={{ 
            fontFamily: "'VT323', monospace", 
            fontSize: '1.5rem', 
            color: '#1A1A1A',
            marginBottom: '0.5rem'
          }}>
            PASSWORD UPDATED
          </h3>
          
          <p style={{ 
            fontSize: '0.8rem', 
            color: '#6B7280',
            marginBottom: '1.5rem',
            fontFamily: "'Space Mono', monospace"
          }}>
            ✅ Redirecting to login...
          </p>
        </div>
      </ReceiptLayout>
    );
  }

  return (
    <ReceiptLayout>
      {error && (
        <div className="receipt-error">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      <form className="receipt-form" onSubmit={handleSubmit}>
        {/* New Password */}
        <div className="receipt-field">
          <label className="receipt-label">New Password</label>
          <div className="receipt-password-container">
            <input
              type={showPassword ? "text" : "password"}
              className="receipt-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              minLength={8}
              required
              disabled={!token}
              style={{ paddingRight: '2.5rem' }}
            />
            <button
              type="button"
              className="receipt-password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="receipt-field">
          <label className="receipt-label">Confirm Password</label>
          <div className="receipt-password-container">
            <input
              type={showConfirm ? "text" : "password"}
              className="receipt-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              minLength={8}
              required
              disabled={!token}
              style={{ paddingRight: '2.5rem' }}
            />
            <button
              type="button"
              className="receipt-password-toggle"
              onClick={() => setShowConfirm(!showConfirm)}
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Total Section */}
        <div className="receipt-total-section">
          <div className="receipt-total-row">
            <span>PASSWORD RESET</span>
            <span>▸</span>
          </div>
        </div>

        <button type="submit" className="receipt-submit" disabled={isLoading || !token}>
          {isLoading ? (
            <>
              <span className="receipt-spinner"></span>
              Resetting...
            </>
          ) : (
            "RESET PASSWORD"
          )}
        </button>
      </form>

      {/* Footer Links */}
      <div className="receipt-links">
        Need a new link? <Link to="/forgot-password">Request Reset</Link>
      </div>
    </ReceiptLayout>
  );
}
