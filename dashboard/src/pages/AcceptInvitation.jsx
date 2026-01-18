import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { UserCheck, AlertCircle, Eye, EyeOff, Shield } from "lucide-react";
import ReceiptLayout from "../components/auth/ReceiptLayout";
import { API_TEAM } from '../config/api';

export default function AcceptInvitation() {
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
  const [isTearingOff, setIsTearingOff] = useState(false);

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
      const res = await fetch(`${API_TEAM}/accept-invitation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      if (res.ok) {
        setSuccess(true);
        setIsTearingOff(true);
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

  const handleTearOffComplete = () => {
    navigate("/login");
  };

  // Success state
  if (success) {
    return (
      <ReceiptLayout isTearingOff={isTearingOff} onTearOff={handleTearOffComplete}>
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
            <UserCheck size={24} style={{ color: '#059669' }} />
          </div>
          
          <h3 style={{ 
            fontFamily: "'VT323', monospace", 
            fontSize: '1.5rem', 
            color: '#1A1A1A',
            marginBottom: '0.5rem'
          }}>
            WELCOME TO THE TEAM!
          </h3>
          
          <p style={{ 
            fontSize: '0.8rem', 
            color: '#6B7280',
            marginBottom: '1.5rem',
            fontFamily: "'Space Mono', monospace"
          }}>
            Your account has been created successfully.
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

      {/* Verified note */}
      <div style={{
        background: '#F0FDF4',
        border: '1px solid #BBF7D0',
        borderRadius: '4px',
        padding: '0.75rem',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontFamily: "'Space Mono', monospace",
        fontSize: '0.7rem',
        color: '#166534'
      }}>
        <Shield size={14} />
        <span>Email pre-verified via invitation</span>
      </div>

      <form className="receipt-form" onSubmit={handleSubmit}>
        {/* Password */}
        <div className="receipt-field">
          <label className="receipt-label">Create Password</label>
          <div className="receipt-password-container">
            <input
              type={showPassword ? "text" : "password"}
              className="receipt-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
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
              placeholder="Re-enter password"
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
            <span>JOIN TEAM</span>
            <span>▸</span>
          </div>
        </div>

        <button type="submit" className="receipt-submit" disabled={isLoading || !token}>
          {isLoading ? (
            <>
              <span className="receipt-spinner"></span>
              Creating...
            </>
          ) : (
            "ACCEPT INVITATION"
          )}
        </button>
      </form>

      {/* Footer Links */}
      <div className="receipt-links">
        Already have an account? <Link to="/login">Sign In</Link>
      </div>
    </ReceiptLayout>
  );
}
