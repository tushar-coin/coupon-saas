package service

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"coupon-backend/internal/domain"
	"coupon-backend/internal/ports"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// CHANGE THIS IN PRODUCTION!
var jwtSecret = []byte("super-secret-key-change-this")

const (
	MaxLoginAttempts   = 5
	LockoutDuration    = 15 * time.Minute
	ResetTokenExpiry   = 15 * time.Minute
	VerificationExpiry = 24 * time.Hour
)

type AuthService struct {
	userRepo ports.UserRepository
	orgRepo  ports.OrganizationRepository
	mailer   *MailerService
}

func NewAuthService(userRepo ports.UserRepository, orgRepo ports.OrganizationRepository, mailer *MailerService) *AuthService {
	return &AuthService{
		userRepo: userRepo,
		orgRepo:  orgRepo,
		mailer:   mailer,
	}
}

// ============ REGISTRATION ============

func (s *AuthService) Register(req domain.RegisterRequest) (*domain.User, *domain.Organization, error) {
	// 1. Check if organization name exists
	if s.orgRepo.Exists(req.OrgName) {
		return nil, nil, errors.New("organization name already exists")
	}

	// 2. Check if user already exists
	if _, err := s.userRepo.FindByEmailAndOrg(req.Email, req.OrgName); err == nil {
		return nil, nil, errors.New("user already exists")
	}

	// 3. Hash Password
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, nil, err
	}

	// 4. Generate Verification Token
	verifyToken := generateSecureToken(64)
	hashedVerifyToken := hashToken(verifyToken)
	verifyExpiry := time.Now().Add(VerificationExpiry)

	// 5. Create Organization
	orgID := uuid.New().String()
	userID := uuid.New().String()

	org := &domain.Organization{
		ID:        orgID,
		Name:      req.OrgName,
		OwnerID:   userID,
		CreatedAt: time.Now(),
	}

	if err := s.orgRepo.Save(org); err != nil {
		return nil, nil, err
	}

	// 6. Create User as Owner
	user := &domain.User{
		ID:                 userID,
		Email:              req.Email,
		OrgID:              orgID,
		OrgName:            req.OrgName,
		Role:               domain.RoleOwner,
		PasswordHash:       string(hashedBytes),
		CreatedAt:          time.Now(),
		EmailVerified:      false,
		VerificationToken:  hashedVerifyToken,
		VerificationExpiry: &verifyExpiry,
	}

	if err := s.userRepo.Save(user); err != nil {
		return nil, nil, err
	}

	// 7. Send Verification Email
	verifyURL := fmt.Sprintf("http://localhost:5173/verify-email?token=%s", verifyToken)
	emailBody := GetVerifyEmailTemplate(verifyURL)

	slog.Info("🚀 Triggering verification email", "to", req.Email)
	go s.mailer.Send(req.Email, "Verify Your Email - CouponFlow", emailBody)

	return user, org, nil
}

// ============ LOGIN WITH LOCKOUT ============

func (s *AuthService) Login(req domain.LoginRequest) (*domain.AuthResponse, error) {
	// 1. Find User
	user, err := s.userRepo.FindByEmailAndOrg(req.Email, req.OrgName)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	// 2. Check if Account is Locked
	if user.LockedUntil != nil && time.Now().Before(*user.LockedUntil) {
		remaining := time.Until(*user.LockedUntil).Minutes()
		return nil, fmt.Errorf("account locked. Try again in %.0f minutes", remaining)
	}

	// 3. Verify Password
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		user.LoginAttempts++

		if user.LoginAttempts >= MaxLoginAttempts {
			lockUntil := time.Now().Add(LockoutDuration)
			user.LockedUntil = &lockUntil
			user.LoginAttempts = 0
			s.userRepo.Save(user)
			return nil, fmt.Errorf("too many failed attempts. Account locked for %v minutes", LockoutDuration.Minutes())
		}

		s.userRepo.Save(user)
		remaining := MaxLoginAttempts - user.LoginAttempts
		return nil, fmt.Errorf("invalid credentials. %d attempts remaining", remaining)
	}

	// 4. Reset Login Attempts on Success
	user.LoginAttempts = 0
	user.LockedUntil = nil
	s.userRepo.Save(user)

	// 5. Generate JWT
	token, err := s.generateToken(user)
	if err != nil {
		return nil, err
	}

	return &domain.AuthResponse{
		Token: token,
		User:  user.ToResponse(),
	}, nil
}

// ============ EMAIL VERIFICATION ============

func (s *AuthService) VerifyEmail(token string) error {
	hashedToken := hashToken(token)

	user, err := s.userRepo.FindByVerificationToken(hashedToken)
	if err != nil {
		return errors.New("invalid verification token")
	}

	if user.VerificationExpiry != nil && time.Now().After(*user.VerificationExpiry) {
		return errors.New("verification token expired")
	}

	user.EmailVerified = true
	user.VerificationToken = ""
	user.VerificationExpiry = nil

	return s.userRepo.Save(user)
}

// ============ PASSWORD RESET ============

func (s *AuthService) RequestPasswordReset(email, orgName string) error {
	user, err := s.userRepo.FindByEmailAndOrg(email, orgName)
	if err != nil {
		// Don't reveal if user exists
		return nil
	}

	resetToken := generateSecureToken(64)
	hashedToken := hashToken(resetToken)
	expiry := time.Now().Add(ResetTokenExpiry)

	user.ResetToken = hashedToken
	user.ResetTokenExpiry = &expiry
	user.ResetTokenUsed = false

	if err := s.userRepo.Save(user); err != nil {
		return err
	}

	resetURL := fmt.Sprintf("http://localhost:5173/reset-password?token=%s", resetToken)
	emailBody := GetResetPasswordTemplate(resetURL)
	go s.mailer.Send(email, "Password Reset Request - CouponFlow", emailBody)

	return nil
}

func (s *AuthService) ResetPassword(token, newPassword string) error {
	hashedToken := hashToken(token)

	user, err := s.userRepo.FindByResetToken(hashedToken)
	if err != nil {
		return errors.New("invalid reset token")
	}

	if user.ResetTokenExpiry != nil && time.Now().After(*user.ResetTokenExpiry) {
		return errors.New("reset token expired")
	}

	if user.ResetTokenUsed {
		return errors.New("reset token already used")
	}

	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user.PasswordHash = string(hashedBytes)
	user.ResetTokenUsed = true
	user.ResetToken = ""
	user.ResetTokenExpiry = nil

	return s.userRepo.Save(user)
}

// ============ JWT HELPERS ============

func (s *AuthService) generateToken(user *domain.User) (string, error) {
	claims := jwt.MapClaims{
		"user_id":        user.ID,
		"org_id":         user.OrgID,
		"org_name":       user.OrgName,
		"role":           user.Role,
		"email_verified": user.EmailVerified,
		"exp":            time.Now().Add(time.Hour * 24).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func (s *AuthService) VerifyToken(tokenString string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}

func (s *AuthService) UploadLogo(userID string, logoURL string) error {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return err
	}

	user.LogoURL = logoURL
	return s.userRepo.Save(user)
}

// ============ UTILITY FUNCTIONS ============

func generateSecureToken(length int) string {
	bytes := make([]byte, length)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

func hashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}
