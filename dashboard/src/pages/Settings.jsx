import { Upload, Save, User as UserIcon, Building, Tag } from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import useOrganizationStore from "../store/useOrganizationStore";
import { useRef, useEffect } from "react";
import TagManager from "../components/ui/TagManager";
import "../styles/Settings.css";

export default function Settings() {
  const { user, uploadLogo, isLoading: authLoading } = useAuthStore();
  const { tags, fetchOrganization, addTag, removeTag, isLoading: orgLoading } = useOrganizationStore();
  const fileInputRef = useRef(null);

  // Fetch organization data on mount
  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  const getInitials = (name) => {
    return name ? name.substring(0, 2).toUpperCase() : "OR";
  };

  const handleFileChange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
          alert("Only JPG and PNG files are allowed.");
          return;
      }

      await uploadLogo(file);
  };

  return (
    <div className="settings-container">
      {/* Organization Profile Card */}
      <div className="card settings-card">
        <h3 className="card-title">Organization Profile</h3>
        
        <div className="settings-section">
          <div className="logo-upload">
            <div className="logo-placeholder">
               {user?.logo_url ? (
                   <img src={user.logo_url} alt="Logo" className="logo-img" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px'}} />
               ) : (
                   getInitials(user?.org_name)
               )}
            </div>
            
            <input 
                type="file" 
                ref={fileInputRef} 
                style={{display: 'none'}} 
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png"
            />
            
            <button 
                className="btn-secondary btn-sm"
                onClick={() => fileInputRef.current.click()}
                disabled={authLoading}
            >
              <Upload size={16} /> {authLoading ? "Uploading..." : "Change Logo"}
            </button>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label><Building size={16} /> Organization Name</label>
              <input 
                type="text" 
                className="input" 
                defaultValue={user?.org_name || ""} 
                placeholder="Organization Name"
                readOnly
              />
            </div>
            
            <div className="form-group">
              <label><UserIcon size={16} /> Contact Email</label>
              <input 
                type="email" 
                className="input" 
                defaultValue={user?.email || ""} 
                placeholder="admin@example.com"
                readOnly 
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
                title="Email cannot be changed"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Product Categories / Tags Card */}
      <div className="card settings-card">
        <h3 className="card-title">
          <Tag size={20} /> Product Categories / Tags
        </h3>
        <p className="card-description">
          Define categories for your products. These can be used to target coupons to specific product categories.
        </p>
        
        <TagManager 
          tags={tags}
          onAddTag={addTag}
          onRemoveTag={removeTag}
          isLoading={orgLoading}
        />
      </div>
    </div>
  );
}

