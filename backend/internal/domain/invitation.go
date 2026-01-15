package domain

import "time"

// Invitation represents a pending team invite
type Invitation struct {
	ID         string     `json:"id"`
	OrgID      string     `json:"org_id"`
	OrgName    string     `json:"org_name"` // Denormalized for convenience
	Email      string     `json:"email"`
	Role       string     `json:"role"` // "admin" or "member"
	Token      string     `json:"token,omitempty"`
	InvitedBy  string     `json:"invited_by"`
	ExpiresAt  time.Time  `json:"expires_at"`
	AcceptedAt *time.Time `json:"accepted_at,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
}

// InvitationResponse for API
type InvitationResponse struct {
	ID         string     `json:"id"`
	Email      string     `json:"email"`
	Role       string     `json:"role"`
	ExpiresAt  time.Time  `json:"expires_at"`
	AcceptedAt *time.Time `json:"accepted_at,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
}

func (i *Invitation) ToResponse() InvitationResponse {
	return InvitationResponse{
		ID:         i.ID,
		Email:      i.Email,
		Role:       i.Role,
		ExpiresAt:  i.ExpiresAt,
		AcceptedAt: i.AcceptedAt,
		CreatedAt:  i.CreatedAt,
	}
}

// Invite request DTO
type InviteRequest struct {
	Email string `json:"email"`
	Role  string `json:"role"` // "admin" or "member"
}

// Accept invitation DTO
type AcceptInvitationRequest struct {
	Token    string `json:"token"`
	Password string `json:"password"`
}
