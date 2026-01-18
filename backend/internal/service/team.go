package service

import (
	"errors"
	"fmt"
	"log/slog"
	"time"

	"coupon-backend/internal/domain"
	"coupon-backend/internal/ports"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

const InvitationExpiry = 7 * 24 * time.Hour // 7 days

type TeamService struct {
	userRepo   ports.UserRepository
	orgRepo    ports.OrganizationRepository
	inviteRepo ports.InvitationRepository
	mailer     *MailerService
}

func NewTeamService(
	userRepo ports.UserRepository,
	orgRepo ports.OrganizationRepository,
	inviteRepo ports.InvitationRepository,
	mailer *MailerService,
) *TeamService {
	return &TeamService{
		userRepo:   userRepo,
		orgRepo:    orgRepo,
		inviteRepo: inviteRepo,
		mailer:     mailer,
	}
}

// InviteUser creates a new invitation
func (s *TeamService) InviteUser(orgID, orgName, inviterID, email, role string) (*domain.Invitation, error) {
	// Validate role
	if role != domain.RoleAdmin && role != domain.RoleMember {
		return nil, errors.New("invalid role, must be 'admin' or 'member'")
	}

	// Check if user already exists in this org
	existingUser, _ := s.userRepo.FindByEmailAndOrg(email, orgName)
	if existingUser != nil {
		return nil, errors.New("user already exists in this organization")
	}

	// Check for pending invitations
	pending, _ := s.inviteRepo.FindPendingByEmail(email)
	for _, inv := range pending {
		if inv.OrgID == orgID {
			return nil, errors.New("invitation already sent to this email")
		}
	}

	// Generate token
	token := generateSecureToken(64)
	hashedToken := hashToken(token)

	invitation := &domain.Invitation{
		ID:        uuid.New().String(),
		OrgID:     orgID,
		OrgName:   orgName,
		Email:     email,
		Role:      role,
		Token:     hashedToken,
		InvitedBy: inviterID,
		ExpiresAt: time.Now().Add(InvitationExpiry),
		CreatedAt: time.Now(),
	}

	if err := s.inviteRepo.Save(invitation); err != nil {
		return nil, err
	}

	// Send invitation email
	inviteURL := fmt.Sprintf("http://localhost:5173/accept-invite?token=%s", token)
	emailBody := GetInvitationTemplate(orgName, role, inviteURL)

	slog.Info("🚀 Triggering invitation email", "to", email, "org", orgName)
	go s.mailer.Send(email, "You're Invited! - CouponFlow", emailBody)

	return invitation, nil
}

// AcceptInvitation creates a new user from an invitation
func (s *TeamService) AcceptInvitation(token, password string) (*domain.User, error) {
	hashedToken := hashToken(token)

	// Find invitation
	invite, err := s.inviteRepo.FindByToken(hashedToken)
	if err != nil {
		return nil, errors.New("invalid invitation token")
	}

	// Check expiry
	if time.Now().After(invite.ExpiresAt) {
		return nil, errors.New("invitation has expired")
	}

	// Check if already accepted
	if invite.AcceptedAt != nil {
		return nil, errors.New("invitation already used")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Create user
	user := &domain.User{
		ID:            uuid.New().String(),
		Email:         invite.Email,
		OrgID:         invite.OrgID,
		OrgName:       invite.OrgName,
		Role:          invite.Role,
		PasswordHash:  string(hashedPassword),
		EmailVerified: true, // Verified via invitation
		CreatedAt:     time.Now(),
	}

	if err := s.userRepo.Save(user); err != nil {
		return nil, err
	}

	// Mark invitation as accepted
	now := time.Now()
	invite.AcceptedAt = &now
	s.inviteRepo.Save(invite)

	return user, nil
}

// ListTeamMembers returns all users in an organization
func (s *TeamService) ListTeamMembers(orgID string) ([]domain.User, error) {
	return s.userRepo.FindByOrgID(orgID)
}

// ListInvitations returns all invitations for an organization
func (s *TeamService) ListInvitations(orgID string) ([]domain.Invitation, error) {
	return s.inviteRepo.FindByOrgID(orgID)
}

// RemoveUser removes a user from the organization
func (s *TeamService) RemoveUser(orgID, userID, requesterID string) error {
	// Get requester
	requester, err := s.userRepo.FindByID(requesterID)
	if err != nil {
		return errors.New("requester not found")
	}

	// Check permissions
	if !requester.CanInvite() {
		return errors.New("insufficient permissions")
	}

	// Get target user
	target, err := s.userRepo.FindByID(userID)
	if err != nil {
		return errors.New("user not found")
	}

	// Verify same org
	if target.OrgID != orgID {
		return errors.New("user not in this organization")
	}

	// Cannot remove owner
	if target.Role == domain.RoleOwner {
		return errors.New("cannot remove organization owner")
	}

	// Cannot remove self
	if userID == requesterID {
		return errors.New("cannot remove yourself")
	}

	return s.userRepo.Delete(userID)
}

// UpdateUserRole changes a user's role
func (s *TeamService) UpdateUserRole(orgID, userID, newRole, requesterID string) error {
	// Get requester
	requester, err := s.userRepo.FindByID(requesterID)
	if err != nil {
		return errors.New("requester not found")
	}

	// Only owner can change roles
	if !requester.CanManageRoles() {
		return errors.New("only owner can change roles")
	}

	// Validate new role
	if newRole != domain.RoleAdmin && newRole != domain.RoleMember {
		return errors.New("invalid role")
	}

	// Get target user
	target, err := s.userRepo.FindByID(userID)
	if err != nil {
		return errors.New("user not found")
	}

	// Verify same org
	if target.OrgID != orgID {
		return errors.New("user not in this organization")
	}

	// Cannot change owner's role
	if target.Role == domain.RoleOwner {
		return errors.New("cannot change owner's role")
	}

	target.Role = newRole
	return s.userRepo.Save(target)
}

// CancelInvitation deletes a pending invitation
func (s *TeamService) CancelInvitation(orgID, invitationID, requesterID string) error {
	requester, err := s.userRepo.FindByID(requesterID)
	if err != nil || !requester.CanInvite() {
		return errors.New("insufficient permissions")
	}

	return s.inviteRepo.Delete(invitationID)
}
