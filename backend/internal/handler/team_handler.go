package handler

import (
	"encoding/json"
	"net/http"

	"coupon-backend/internal/domain"
	"coupon-backend/internal/service"
)

type TeamHandler struct {
	svc     *service.TeamService
	authSvc *service.AuthService
}

func NewTeamHandler(svc *service.TeamService, authSvc *service.AuthService) *TeamHandler {
	return &TeamHandler{svc: svc, authSvc: authSvc}
}

// POST /api/v1/team/invite
func (h *TeamHandler) InviteUser(w http.ResponseWriter, r *http.Request) {
	// Get claims from context (set by middleware)
	orgID := r.Context().Value("org_id").(string)
	orgName := r.Context().Value("org_name").(string)
	userID := r.Context().Value("user_id").(string)
	role := r.Context().Value("role").(string)

	// Check permission
	if role != domain.RoleOwner && role != domain.RoleAdmin {
		http.Error(w, "Insufficient permissions", http.StatusForbidden)
		return
	}

	var req domain.InviteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.Role == "" {
		http.Error(w, "Email and role are required", http.StatusBadRequest)
		return
	}

	invitation, err := h.svc.InviteUser(orgID, orgName, userID, req.Email, req.Role)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(invitation.ToResponse())
}

// POST /api/v1/team/accept-invitation (Public - no auth required)
func (h *TeamHandler) AcceptInvitation(w http.ResponseWriter, r *http.Request) {
	var req domain.AcceptInvitationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Token == "" || req.Password == "" {
		http.Error(w, "Token and password are required", http.StatusBadRequest)
		return
	}

	if len(req.Password) < 8 {
		http.Error(w, "Password must be at least 8 characters", http.StatusBadRequest)
		return
	}

	user, err := h.svc.AcceptInvitation(req.Token, req.Password)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Account created successfully. You can now log in.",
		"user":    user.ToResponse(),
	})
}

// GET /api/v1/team/members
func (h *TeamHandler) ListMembers(w http.ResponseWriter, r *http.Request) {
	orgID := r.Context().Value("org_id").(string)

	members, err := h.svc.ListTeamMembers(orgID)
	if err != nil {
		http.Error(w, "Failed to list members", http.StatusInternalServerError)
		return
	}

	// Convert to response format
	var response []domain.UserResponse
	for _, m := range members {
		response = append(response, m.ToResponse())
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GET /api/v1/team/invitations
func (h *TeamHandler) ListInvitations(w http.ResponseWriter, r *http.Request) {
	orgID := r.Context().Value("org_id").(string)
	role := r.Context().Value("role").(string)

	// Only admins can see invitations
	if role != domain.RoleOwner && role != domain.RoleAdmin {
		http.Error(w, "Insufficient permissions", http.StatusForbidden)
		return
	}

	invitations, err := h.svc.ListInvitations(orgID)
	if err != nil {
		http.Error(w, "Failed to list invitations", http.StatusInternalServerError)
		return
	}

	// Convert to response format
	var response []domain.InvitationResponse
	for _, inv := range invitations {
		response = append(response, inv.ToResponse())
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// DELETE /api/v1/team/members/{userId}
func (h *TeamHandler) RemoveMember(w http.ResponseWriter, r *http.Request) {
	orgID := r.Context().Value("org_id").(string)
	requesterID := r.Context().Value("user_id").(string)

	// Extract userId from path
	targetUserID := r.PathValue("userId")
	if targetUserID == "" {
		http.Error(w, "User ID required", http.StatusBadRequest)
		return
	}

	err := h.svc.RemoveUser(orgID, targetUserID, requesterID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// PUT /api/v1/team/members/{userId}/role
func (h *TeamHandler) UpdateRole(w http.ResponseWriter, r *http.Request) {
	orgID := r.Context().Value("org_id").(string)
	requesterID := r.Context().Value("user_id").(string)

	targetUserID := r.PathValue("userId")
	if targetUserID == "" {
		http.Error(w, "User ID required", http.StatusBadRequest)
		return
	}

	var req struct {
		Role string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	err := h.svc.UpdateUserRole(orgID, targetUserID, req.Role, requesterID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Role updated"})
}

// DELETE /api/v1/team/invitations/{invitationId}
func (h *TeamHandler) CancelInvitation(w http.ResponseWriter, r *http.Request) {
	orgID := r.Context().Value("org_id").(string)
	requesterID := r.Context().Value("user_id").(string)

	invitationID := r.PathValue("invitationId")
	if invitationID == "" {
		http.Error(w, "Invitation ID required", http.StatusBadRequest)
		return
	}

	err := h.svc.CancelInvitation(orgID, invitationID, requesterID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
