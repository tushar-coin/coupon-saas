import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import PasswordInput from "../components/PasswordInput";
import "../styles/Auth.css";

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    orgName: ""
  });

  const [validationErrors, setValidationErrors] = useState({});

  // Real-time validation
  const validateField = (name, value) => {
    const errors = { ...validationErrors };
    
    switch (name) {
      case "orgName":
        if (value.length < 2) {
          errors.orgName = "Organization name must be at least 2 characters";
        } else if (value.length > 50) {
          errors.orgName = "Organization name must be less than 50 characters";
        } else {
          delete errors.orgName;
        }
        break;
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.email = "Please enter a valid email address";
        } else {
          delete errors.email;
        }
        break;
      case "password":
        if (value.length < 8) {
          errors.password = "Password must be at least 8 characters";
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
    
    // Final validation before submit
    if (formData.password.length < 8) {
      setValidationErrors({ ...validationErrors, password: "Password must be at least 8 characters" });
      return;
    }

    const success = await register(formData.email, formData.password, formData.orgName);
    if (success) {
      navigate("/login");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass">
        <h2 className="auth-title">Create Organization</h2>
        <p className="auth-subtitle">Get started with CouponFlow today</p>
        
        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Organization Name</label>
            <input 
              type="text" 
              name="orgName"
              className={`input ${validationErrors.orgName ? 'input-error' : ''}`}
              placeholder="e.g. Acme Corp" 
              required
              value={formData.orgName}
              onChange={handleChange}
              onBlur={(e) => validateField("orgName", e.target.value)}
            />
            {validationErrors.orgName && (
              <span className="field-error">{validationErrors.orgName}</span>
            )}
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email"
              name="email"
              className={`input ${validationErrors.email ? 'input-error' : ''}`}
              placeholder="merchant@acme.com" 
              required
              value={formData.email}
              onChange={handleChange}
              onBlur={(e) => validateField("email", e.target.value)}
            />
            {validationErrors.email && (
              <span className="field-error">{validationErrors.email}</span>
            )}
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <PasswordInput
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                validateField("password", e.target.value);
              }}
              placeholder="Create a strong password"
              showStrength={true}
            />
          </div>

          <button 
             type="submit" 
             className="btn-primary"
             style={{ width: '100%', marginTop: '1rem' }}
             disabled={isLoading || Object.keys(validationErrors).length > 0}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>
        
        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
