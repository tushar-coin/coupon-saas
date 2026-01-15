import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserPlus, Mail, Shield, Trash2, Crown, X, Send } from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import useToastStore from "../store/useToastStore";
import CustomSelect from "../components/CustomSelect";
import ConfirmModal from "../components/ConfirmModal";
import "../styles/Team.css";

const API_URL = 'http://localhost:8081/api/v1/team';

const roleOptions = [
  { value: 'admin', label: 'Admin', description: 'Can manage team & coupons' },
  { value: 'member', label: 'Member', description: 'Can create coupons' },
];

export default function Team() {
  const { user, canInvite, canManageRoles } = useAuthStore();
  const toast = useToastStore();
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, userId: null, email: '' });

  const token = localStorage.getItem('auth_token');

  const fetchTeamData = async () => {
    try {
      const [membersRes, invitesRes] = await Promise.all([
        fetch(`${API_URL}/members`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        canInvite() ? fetch(`${API_URL}/invitations`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }) : Promise.resolve({ ok: true, json: () => [] })
      ]);

      if (membersRes.ok) {
        const data = await membersRes.json();
        setMembers(data || []);
      }

      if (invitesRes.ok && canInvite()) {
        const data = await invitesRes.json();
        setInvitations((data || []).filter(inv => !inv.accepted_at));
      }
    } catch (err) {
      toast.error("Failed to load team data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  const handleRemoveMember = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/members/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        setMembers(members.filter(m => m.id !== userId));
        toast.success("Team member removed successfully");
      } else {
        const err = await res.text();
        toast.error(err || "Failed to remove member");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await fetch(`${API_URL}/members/${userId}/role`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });
      
      if (res.ok) {
        setMembers(members.map(m => 
          m.id === userId ? { ...m, role: newRole } : m
        ));
        toast.success(`Role updated to ${newRole}`);
      } else {
        const err = await res.text();
        toast.error(err || "Failed to update role");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    try {
      const res = await fetch(`${API_URL}/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        setInvitations(invitations.filter(i => i.id !== invitationId));
        toast.info("Invitation cancelled");
      }
    } catch (err) {
      toast.error("Failed to cancel invitation");
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'owner': return 'badge-owner';
      case 'admin': return 'badge-admin';
      default: return 'badge-member';
    }
  };

  if (isLoading) {
    return (
      <div className="team-loading">
        <div className="spinner-large"></div>
        <p>Loading team...</p>
      </div>
    );
  }

  return (
    <div className="team-page">
      {/* Header */}
      <motion.div 
        className="team-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1><Users size={24} /> Team Members</h1>
          <p className="team-subtitle">{members.length} {members.length === 1 ? 'member' : 'members'} in {user?.org_name}</p>
        </div>
        {canInvite() && (
          <motion.button 
            className="btn-primary btn-invite"
            onClick={() => setShowInviteModal(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <UserPlus size={18} /> Invite Member
          </motion.button>
        )}
      </motion.div>

      {/* Members Table */}
      <motion.div 
        className="team-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <table className="team-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Role</th>
              <th>Status</th>
              {canInvite() && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {members.map((member, index) => (
                <motion.tr 
                  key={member.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <td>
                    <div className="member-info">
                      <motion.div 
                        className="member-avatar"
                        whileHover={{ scale: 1.1 }}
                      >
                        {member.email.charAt(0).toUpperCase()}
                      </motion.div>
                      <div>
                        <div className="member-email">{member.email}</div>
                        {member.id === user?.id && <span className="you-badge">You</span>}
                      </div>
                    </div>
                  </td>
                  <td>
                    {canManageRoles() && member.role !== 'owner' ? (
                      <CustomSelect
                        options={roleOptions}
                        value={member.role}
                        onChange={(newRole) => handleRoleChange(member.id, newRole)}
                      />
                    ) : (
                      <motion.span 
                        className={`role-badge ${getRoleBadgeClass(member.role)}`}
                        whileHover={{ scale: 1.05 }}
                      >
                        {member.role === 'owner' && <Crown size={12} />}
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </motion.span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${member.email_verified ? 'status-active' : 'status-pending'}`}>
                      <span className="status-dot"></span>
                      {member.email_verified ? 'Active' : 'Pending'}
                    </span>
                  </td>
                  {canInvite() && (
                    <td>
                      {member.role !== 'owner' && member.id !== user?.id && (
                        <motion.button 
                          className="btn-icon btn-danger"
                          onClick={() => setConfirmModal({ 
                            open: true, 
                            userId: member.id, 
                            email: member.email 
                          })}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      )}
                    </td>
                  )}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </motion.div>

      {/* Pending Invitations */}
      {canInvite() && invitations.length > 0 && (
        <motion.div 
          className="team-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h3><Mail size={18} /> Pending Invitations</h3>
          <div className="invitations-grid">
            {invitations.map((inv) => (
              <motion.div 
                key={inv.id} 
                className="invitation-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -2 }}
              >
                <div className="invitation-info">
                  <div className="invitation-email">{inv.email}</div>
                  <span className={`role-badge ${getRoleBadgeClass(inv.role)}`}>
                    {inv.role.charAt(0).toUpperCase() + inv.role.slice(1)}
                  </span>
                </div>
                <div className="invitation-actions">
                  <span className="invitation-expiry">
                    Expires {new Date(inv.expires_at).toLocaleDateString()}
                  </span>
                  <motion.button 
                    className="btn-icon btn-danger-light"
                    onClick={() => handleCancelInvitation(inv.id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={16} />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <InviteModal 
            onClose={() => setShowInviteModal(false)} 
            onSuccess={(email) => {
              setShowInviteModal(false);
              fetchTeamData();
              toast.success(`Invitation sent to ${email}`);
            }}
          />
        )}
      </AnimatePresence>

      {/* Confirm Remove Modal */}
      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, userId: null, email: '' })}
        onConfirm={() => handleRemoveMember(confirmModal.userId)}
        title="Remove Team Member"
        message={`Are you sure you want to remove ${confirmModal.email} from your organization? They will lose access immediately.`}
        confirmText="Remove Member"
        variant="danger"
      />
    </div>
  );
}

function InviteModal({ onClose, onSuccess }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const toast = useToastStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, role })
      });

      if (res.ok) {
        onSuccess(email);
      } else {
        const err = await res.text();
        setError(err || "Failed to send invitation");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const inviteRoleOptions = [
    { value: 'member', label: 'Member', description: 'Can create and edit coupons' },
    { value: 'admin', label: 'Admin', description: 'Can also manage team members' },
  ];

  return (
    <motion.div 
      className="modal-overlay" 
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="modal-content invite-modal"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <div className="modal-header">
          <h2><UserPlus size={22} /> Invite Team Member</h2>
          <motion.button 
            className="modal-close" 
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X size={20} />
          </motion.button>
        </div>

        {error && (
          <motion.div 
            className="modal-error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="input"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Role</label>
            <CustomSelect
              options={inviteRoleOptions}
              value={role}
              onChange={setRole}
            />
          </div>

          <div className="invite-note">
            <Shield size={14} />
            <span>An invitation email will be sent with a link to join your organization.</span>
          </div>

          <div className="modal-actions">
            <motion.button 
              type="button" 
              className="btn-secondary" 
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
            <motion.button 
              type="submit" 
              className="btn-primary" 
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} /> Send Invitation
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
