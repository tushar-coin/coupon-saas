import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import ReceiptLayout from "../components/auth/ReceiptLayout";

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    orgName: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isTearingOff, setIsTearingOff] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const validateField = (name, value) => {
    const errors = { ...validationErrors };
    
    switch (name) {
      case "orgName":
        if (value.length < 2) {
          errors.orgName = "Min 2 characters";
        } else if (value.length > 50) {
          errors.orgName = "Max 50 characters";
        } else {
          delete errors.orgName;
        }
        break;
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.email = "Invalid email format";
        } else {
          delete errors.email;
        }
        break;
      case "password":
        if (value.length < 8) {
          errors.password = "Min 8 characters";
        } else {
          delete errors.password;
        }
        break;
      default:
        break;
    }
    
    setValidationErrors(errors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password.length < 8) {
      setValidationErrors({ ...validationErrors, password: "Min 8 characters" });
      return;
    }

    const success = await register(formData.email, formData.password, formData.orgName);
    if (success) {
      setIsTearingOff(true);
    }
  };

  const handleTearOffComplete = () => {
    navigate("/login");
  };

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
            name="orgName"
            className="receipt-input"
            placeholder="e.g. Acme Corp" 
            required
            value={formData.orgName}
            onChange={handleChange}
            onBlur={(e) => validateField("orgName", e.target.value)}
          />
          {validationErrors.orgName && (
            <span className="receipt-field-error">{validationErrors.orgName}</span>
          )}
        </div>

        {/* Email Field */}
        <div className="receipt-field">
          <label className="receipt-label">Email Address</label>
          <input 
            type="email"
            name="email"
            className="receipt-input"
            placeholder="merchant@acme.com" 
            required
            value={formData.email}
            onChange={handleChange}
            onBlur={(e) => validateField("email", e.target.value)}
          />
          {validationErrors.email && (
            <span className="receipt-field-error">{validationErrors.email}</span>
          )}
        </div>
        
        {/* Password Field */}
        <div className="receipt-field">
          <label className="receipt-label">Password</label>
          <div className="receipt-password-container">
            <input 
              type={showPassword ? "text" : "password"}
              name="password"
              className="receipt-input"
              placeholder="Min. 8 characters"
              required
              minLength={8}
              value={formData.password}
              onChange={handleChange}
              onBlur={(e) => validateField("password", e.target.value)}
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
          {validationErrors.password && (
            <span className="receipt-field-error">{validationErrors.password}</span>
          )}
        </div>

        {/* Total Section with Submit */}
        <div className="receipt-total-section">
          <div className="receipt-total-row">
            <span>NEW ACCOUNT</span>
            <span>▸</span>
          </div>
        </div>

        <button 
          type="submit" 
          className="receipt-submit"
          disabled={isLoading || Object.keys(validationErrors).length > 0}
        >
          {isLoading ? (
            <>
              <span className="receipt-spinner"></span>
              Creating...
            </>
          ) : (
            "CREATE ORGANIZATION"
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
