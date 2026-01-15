package domain

import "time"

// Role constants
const (
	RoleOwner  = "owner"
	RoleAdmin  = "admin"
	RoleMember = "member"
)

// User represents the database model with all fields serialized to JSON.
type User struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	OrgID        string    `json:"org_id"`   // Foreign key to Organization
	OrgName      string    `json:"org_name"` // Denormalized for convenience
	Role         string    `json:"role"`     // "owner", "admin", "member"
	LogoURL      string    `json:"logo_url"`
	PasswordHash string    `json:"password_hash,omitempty"`
	CreatedAt    time.Time `json:"created_at"`

	// Security: Email Verification
	EmailVerified      bool       `json:"email_verified"`
	VerificationToken  string     `json:"verification_token,omitempty"`
	VerificationExpiry *time.Time `json:"verification_expiry,omitempty"`

	// Security: Password Reset
	ResetToken       string     `json:"reset_token,omitempty"`
	ResetTokenExpiry *time.Time `json:"reset_token_expiry,omitempty"`
	ResetTokenUsed   bool       `json:"reset_token_used,omitempty"`

	// Security: Account Lockout
	LoginAttempts int        `json:"login_attempts,omitempty"`
	LockedUntil   *time.Time `json:"locked_until,omitempty"`
}

// UserResponse is safe for API responses (hides sensitive fields)
type UserResponse struct {
	ID            string    `json:"id"`
	Email         string    `json:"email"`
	OrgID         string    `json:"org_id"`
	OrgName       string    `json:"org_name"`
	Role          string    `json:"role"`
	LogoURL       string    `json:"logo_url"`
	EmailVerified bool      `json:"email_verified"`
	CreatedAt     time.Time `json:"created_at"`
}

// ToResponse converts User to UserResponse (safe for API)
func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:            u.ID,
		Email:         u.Email,
		OrgID:         u.OrgID,
		OrgName:       u.OrgName,
		Role:          u.Role,
		LogoURL:       u.LogoURL,
		EmailVerified: u.EmailVerified,
		CreatedAt:     u.CreatedAt,
	}
}

// CanInvite checks if user has permission to invite others
func (u *User) CanInvite() bool {
	return u.Role == RoleOwner || u.Role == RoleAdmin
}

// CanDelete checks if user can delete coupons
func (u *User) CanDelete() bool {
	return u.Role == RoleOwner || u.Role == RoleAdmin
}

// CanManageRoles checks if user can change roles
func (u *User) CanManageRoles() bool {
	return u.Role == RoleOwner
}

type LoginRequest struct {
	Email    string `json:"email"`
	OrgName  string `json:"org_name"`
	Password string `json:"password"`
}

type RegisterRequest struct {
	Email    string `json:"email"`
	OrgName  string `json:"org_name"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token string       `json:"token"`
	User  UserResponse `json:"user"`
}

// Password Reset DTOs
type ForgotPasswordRequest struct {
	Email   string `json:"email"`
	OrgName string `json:"org_name"`
}

type ResetPasswordRequest struct {
	Token       string `json:"token"`
	NewPassword string `json:"new_password"`
}
