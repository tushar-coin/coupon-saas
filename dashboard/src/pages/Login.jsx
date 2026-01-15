import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import "../styles/Auth.css";

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    orgName: ""
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(formData.email, formData.password, formData.orgName);
    if (success) {
      navigate("/");
    }
  };

  // Check if error indicates lockout
  const isLocked = error?.toLowerCase().includes("locked");

  return (
    <div className="auth-container">
      <div className="auth-card glass">
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Sign in to CouponFlow</p>
        
        {error && (
          <div className={`auth-error ${isLocked ? 'auth-error-locked' : ''}`}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Organization Name</label>
            <input 
              type="text" 
              className="input" 
              placeholder="Acme Corp" 
              required
              value={formData.orgName}
              onChange={(e) => setFormData({...formData, orgName: e.target.value})}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              className="input" 
              placeholder="merchant@example.com" 
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <div className="password-input-container">
              <input 
                type={showPassword ? "text" : "password"}
                className="input password-input" 
                placeholder="••••••••" 
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={isLoading || isLocked}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
        
        <p className="auth-footer">
          <Link to="/forgot-password" style={{ display: 'block', marginBottom: '0.5rem' }}>Forgot your password?</Link>
          Don't have an account? <Link to="/register">Create Organization</Link>
        </p>
      </div>
    </div>
  );
}
