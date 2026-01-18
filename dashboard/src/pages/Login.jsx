import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import ReceiptLayout from "../components/auth/ReceiptLayout";

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    orgName: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isTearingOff, setIsTearingOff] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(formData.email, formData.password, formData.orgName);
    if (success) {
      // Trigger tear-off animation
      setIsTearingOff(true);
    }
  };

  const handleTearOffComplete = () => {
    navigate("/");
  };

  const isLocked = error?.toLowerCase().includes("locked");

  return (
    <ReceiptLayout 
      isTearingOff={isTearingOff} 
      onTearOff={handleTearOffComplete}
    >
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
            placeholder="Acme Corp" 
            required
            value={formData.orgName}
            onChange={(e) => setFormData({...formData, orgName: e.target.value})}
            autoFocus
          />
        </div>

        {/* Email Field */}
        <div className="receipt-field">
          <label className="receipt-label">Email</label>
          <input 
            type="email" 
            className="receipt-input"
            placeholder="merchant@example.com" 
            required
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>
        
        {/* Password Field */}
        <div className="receipt-field">
          <label className="receipt-label">Password</label>
          <div className="receipt-password-container">
            <input 
              type={showPassword ? "text" : "password"}
              className="receipt-input"
              placeholder="••••••••" 
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
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
        
        {/* Total Section with Submit */}
        <div className="receipt-total-section">
          <div className="receipt-total-row">
            <span>TOTAL ACCESS</span>
            <span>▸</span>
          </div>
        </div>

        <button 
          type="submit" 
          className="receipt-submit"
          disabled={isLoading || isLocked}
        >
          {isLoading ? (
            <>
              <span className="receipt-spinner"></span>
              Processing...
            </>
          ) : (
            "AUTHENTICATE"
          )}
        </button>
      </form>
      
      {/* Footer Links */}
      <div className="receipt-links">
        <Link to="/forgot-password">Forgot password?</Link>
        {" · "}
        <Link to="/register">Create Organization</Link>
      </div>
    </ReceiptLayout>
  );
}
