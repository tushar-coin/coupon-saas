import { Upload, Save, User, Building } from "lucide-react";
import "../styles/Settings.css";

export default function Settings() {
  return (
    <div className="settings-container">
      <div className="card settings-card">
        <h3 className="card-title">Organization Profile</h3>
        
        <div className="settings-section">
          <div className="logo-upload">
            <div className="logo-placeholder">AC</div>
            <button className="btn-secondary btn-sm">
              <Upload size={16} /> Change Logo
            </button>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label><Building size={16} /> Organization Name</label>
              <input type="text" className="input" defaultValue="Acme Corp" />
            </div>
            
            <div className="form-group">
              <label><User size={16} /> Contact Email</label>
              <input type="email" className="input" defaultValue="admin@acmecorp.com" />
            </div>
          </div>
        </div>



        <div className="settings-footer">
          <button className="btn-primary">
            <Save size={18} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
