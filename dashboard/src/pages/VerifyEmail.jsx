import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Loader } from "lucide-react";
import ReceiptLayout from "../components/auth/ReceiptLayout";
import { API_AUTH } from '../config/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("");
  
  // Guard against React StrictMode double-execution
  const hasVerified = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    // Prevent double API call in React StrictMode
    if (hasVerified.current) {
      return;
    }
    hasVerified.current = true;

    // Call verification API
    const verifyEmail = async () => {
      try {
        const response = await fetch(`${API_AUTH}/verify-email?token=${token}`);
        
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

  const getStatusIcon = () => {
    switch (status) {
      case "verifying":
        return (
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#FEF3C7',
            marginBottom: '1rem'
          }}>
            <Loader size={24} style={{ color: '#D97706', animation: 'receipt-spin 1s linear infinite' }} />
          </div>
        );
      case "success":
        return (
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
        );
      case "error":
        return (
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#FEE2E2',
            marginBottom: '1rem'
          }}>
            <XCircle size={24} style={{ color: '#DC2626' }} />
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case "verifying": return "VERIFYING EMAIL";
      case "success": return "EMAIL VERIFIED";
      case "error": return "VERIFICATION FAILED";
      default: return "";
    }
  };

  return (
    <ReceiptLayout>
      <div style={{ textAlign: 'center', padding: '1rem 0' }}>
        {getStatusIcon()}
        
        <h3 style={{ 
          fontFamily: "'VT323', monospace", 
          fontSize: '1.5rem', 
          color: '#1A1A1A',
          marginBottom: '0.5rem'
        }}>
          {getStatusTitle()}
        </h3>
        
        <p style={{ 
          fontSize: '0.8rem', 
          color: '#6B7280',
          marginBottom: '1.5rem',
          fontFamily: "'Space Mono', monospace"
        }}>
          {status === "verifying" ? "Please wait..." : message}
        </p>

        {status === "success" && (
          <div style={{
            background: '#F3F4F6',
            padding: '0.75rem',
            borderRadius: '4px',
            marginBottom: '1.5rem',
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.7rem',
            color: '#4B5563'
          }}>
            ✅ You can now access all features
          </div>
        )}
      </div>

      <Link 
        to="/login" 
        className="receipt-submit"
        style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
      >
        GO TO LOGIN
      </Link>
    </ReceiptLayout>
  );
}
