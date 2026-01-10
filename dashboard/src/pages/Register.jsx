import { Link } from "react-router-dom";
import "../styles/Auth.css";

export default function Register() {
  return (
    <div className="auth-container">
      <div className="auth-card glass">
        <h2 className="auth-title">Create Organization</h2>
        <p className="auth-subtitle">Get started with CouponFlow today</p>
        
        <form className="auth-form">
          <div className="form-group">
            <label>Organization Name</label>
            <input type="text" className="input" placeholder="e.g. Acme Corp" />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input type="email" className="input" placeholder="merchant@acme.com" />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input type="password" className="input" placeholder="Min. 8 characters" />
          </div>

          <button type="button" className="btn-primary">
            Create Account
          </button>
        </form>
        
        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
