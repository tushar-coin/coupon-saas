import { Link } from "react-router-dom";
import "../styles/Auth.css";

export default function Login() {
  return (
    <div className="auth-container">
      <div className="auth-card glass">
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Sign in to CouponFlow</p>
        
        <form className="auth-form">
          <div className="form-group">
            <label>Organization Name</label>
            <input type="text" className="input" placeholder="Acme Corp" />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input type="email" className="input" placeholder="merchant@example.com" />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input type="password" className="input" placeholder="••••••••" />
          </div>
          
          <Link to="/dashboard" className="btn-primary" style={{ textAlign: "center", textDecoration: "none" }}>
            Sign In
          </Link>
        </form>
        
        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create Organization</Link>
        </p>
      </div>
    </div>
  );
}
