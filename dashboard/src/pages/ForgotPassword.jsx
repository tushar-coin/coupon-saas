import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle, Mail } from "lucide-react";
import ReceiptLayout from "../components/auth/ReceiptLayout";
import { API_AUTH } from '../config/api';

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
      const response = await fetch(`${API_AUTH}/forgot-password`, {
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

  // Success state - Email sent
  if (submitted) {
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
            <Mail size={24} style={{ color: '#059669' }} />
          </div>
          
          <h3 style={{ 
            fontFamily: "'VT323', monospace", 
            fontSize: '1.5rem', 
            color: '#1A1A1A',
            marginBottom: '0.5rem'
          }}>
            CHECK YOUR INBOX
          </h3>
          
          <p style={{ 
            fontSize: '0.8rem', 
            color: '#6B7280',
            marginBottom: '1.5rem',
            fontFamily: "'Space Mono', monospace"
          }}>
            If an account exists with this email,<br/>
            we've sent password reset instructions.
          </p>

          <div style={{
            background: '#F3F4F6',
            padding: '0.75rem',
            borderRadius: '4px',
            marginBottom: '1.5rem',
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.7rem',
            color: '#4B5563'
          }}>
            📧 Check spam folder • Link expires in 15 min
          </div>
        </div>

        <Link 
          to="/login" 
          className="receipt-submit"
          style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
        >
          RETURN TO LOGIN
        </Link>
      </ReceiptLayout>
    );
  }

  // Form state
  return (
    <ReceiptLayout>
      {error && (
        <div className="receipt-error">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      <form className="receipt-form" onSubmit={handleSubmit}>
        {/* Organization Field */}
        <div className="receipt-field">
          <label className="receipt-label">Organization</label>
          <input
            type="text"
            className="receipt-input"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="Enter your organization"
            required
          />
        </div>

        {/* Email Field */}
        <div className="receipt-field">
          <label className="receipt-label">Email Address</label>
          <input
            type="email"
            className="receipt-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>

        {/* Total Section */}
        <div className="receipt-total-section">
          <div className="receipt-total-row">
            <span>RESET REQUEST</span>
            <span>▸</span>
          </div>
        </div>

        <button type="submit" className="receipt-submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="receipt-spinner"></span>
              Sending...
            </>
          ) : (
            "SEND RESET LINK"
          )}
        </button>
      </form>

      {/* Footer Links */}
      <div className="receipt-links">
        Remember your password? <Link to="/login">Sign In</Link>
      </div>
    </ReceiptLayout>
  );
}
