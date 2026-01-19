package postgres

import (
	"context"
	"coupon-backend/internal/domain"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepository struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{db: db}
}

// Save inserts or updates a user.
// Note: The interface implies Save might be UPSERT or strict Insert.
// Given typical usage, we usually use Save for both Create and Update in strict repositories,
// but often standard is Insert. I will implement UPSERT to be safe if ID exists, or just Insert.
// Looking at the legacy code is better, but simpler is Insert.
// Actually, `organization_repo` I only did Insert.
// Let's assume Save means "Create New or Replace" or just "Create".
// Usually `Save` in Go repos = Create. `Update` is separate.
// Existing Interface has `Delete` but no `Update`?
// Wait, `coupon_repo` has `Update`. `user_repo` in interface DOES NOT HAVE Update method in the file I read!
// File content for UserRepository interface:
// type UserRepository interface {
// 	Save(user *domain.User) error
// 	FindByEmailAndOrg(email, orgName string) (*domain.User, error)
// 	FindByID(id string) (*domain.User, error)
// 	FindByOrgID(orgID string) ([]domain.User, error)
// 	FindByResetToken(hashedToken string) (*domain.User, error)
// 	FindByVerificationToken(hashedToken string) (*domain.User, error)
// 	Delete(id string) error
// }
// It seems `Save` handles both? Or maybe they never update users?
// I will implement Save as an UPSERT on conflict of ID, or just Insert.
// Given `created_at` in struct, likely Insert.
// I will implement as Insert with On Conflict Update for safety, or check if ID exists?
// Let's just do UPSERT (Insert ... ON CONFLICT (id) DO UPDATE).

func (r *UserRepository) Save(u *domain.User) error {
	query := `
		INSERT INTO users (
			id, email, password_hash, org_id, org_name, role, logo_url,
			email_verified, verification_token, verification_expiry,
			reset_token_used, reset_token, reset_token_expiry, 
			login_attempts, locked_until, created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7,
			$8, $9, $10,
			$11, $12, $13,
			$14, $15, $16
		)
		ON CONFLICT (id) DO UPDATE SET
			email = EXCLUDED.email,
			password_hash = EXCLUDED.password_hash,
			org_id = EXCLUDED.org_id,
			org_name = EXCLUDED.org_name,
			role = EXCLUDED.role,
			logo_url = EXCLUDED.logo_url,
			email_verified = EXCLUDED.email_verified,
			verification_token = EXCLUDED.verification_token,
			verification_expiry = EXCLUDED.verification_expiry,
			reset_token_used = EXCLUDED.reset_token_used,
			reset_token = EXCLUDED.reset_token,
			reset_token_expiry = EXCLUDED.reset_token_expiry,
			login_attempts = EXCLUDED.login_attempts,
			locked_until = EXCLUDED.locked_until;
	`

	_, err := r.db.Exec(context.Background(), query,
		u.ID, u.Email, u.PasswordHash, u.OrgID, u.OrgName, u.Role, u.LogoURL,
		u.EmailVerified, u.VerificationToken, u.VerificationExpiry,
		u.ResetTokenUsed, u.ResetToken, u.ResetTokenExpiry,
		u.LoginAttempts, u.LockedUntil, u.CreatedAt,
	)
	return err
}

func (r *UserRepository) FindByEmailAndOrg(email, orgName string) (*domain.User, error) {
	// Note: We use org_name for compatibility with the interface, but strictly, org_id is better.
	// Since email is unique, we find by email.
	query := `
		SELECT 
			id, email, password_hash, org_id, org_name, role, COALESCE(logo_url, ''),
			email_verified, COALESCE(verification_token, ''), verification_expiry,
			reset_token_used, COALESCE(reset_token, ''), reset_token_expiry, 
			COALESCE(login_attempts, 0), locked_until, created_at
		FROM users
		WHERE email = $1 AND org_name = $2
	`
	return r.scanUser(query, email, orgName)
}

func (r *UserRepository) FindByID(id string) (*domain.User, error) {
	query := `
		SELECT 
			id, email, password_hash, org_id, org_name, role, COALESCE(logo_url, ''),
			email_verified, COALESCE(verification_token, ''), verification_expiry,
			reset_token_used, COALESCE(reset_token, ''), reset_token_expiry, 
			COALESCE(login_attempts, 0), locked_until, created_at
		FROM users
		WHERE id = $1
	`
	return r.scanUser(query, id)
}

func (r *UserRepository) FindByOrgID(orgID string) ([]domain.User, error) {
	query := `
		SELECT 
			id, email, password_hash, org_id, org_name, role, COALESCE(logo_url, ''),
			email_verified, COALESCE(verification_token, ''), verification_expiry,
			reset_token_used, COALESCE(reset_token, ''), reset_token_expiry, 
			COALESCE(login_attempts, 0), locked_until, created_at
		FROM users
		WHERE org_id = $1
	`
	rows, err := r.db.Query(context.Background(), query, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []domain.User
	for rows.Next() {
		u := domain.User{}
		err := rows.Scan(
			&u.ID, &u.Email, &u.PasswordHash, &u.OrgID, &u.OrgName, &u.Role, &u.LogoURL,
			&u.EmailVerified, &u.VerificationToken, &u.VerificationExpiry,
			&u.ResetTokenUsed, &u.ResetToken, &u.ResetTokenExpiry,
			&u.LoginAttempts, &u.LockedUntil, &u.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}

func (r *UserRepository) FindByResetToken(hashedToken string) (*domain.User, error) {
	// Note: Schema has reset_token column.
	query := `
		SELECT 
			id, email, password_hash, org_id, org_name, role, COALESCE(logo_url, ''),
			email_verified, COALESCE(verification_token, ''), verification_expiry,
			reset_token_used, COALESCE(reset_token, ''), reset_token_expiry, 
			COALESCE(login_attempts, 0), locked_until, created_at
		FROM users
		WHERE reset_token = $1
	`
	return r.scanUser(query, hashedToken)
}

func (r *UserRepository) FindByVerificationToken(hashedToken string) (*domain.User, error) {
	query := `
		SELECT 
			id, email, password_hash, org_id, org_name, role, COALESCE(logo_url, ''),
			email_verified, COALESCE(verification_token, ''), verification_expiry,
			reset_token_used, COALESCE(reset_token, ''), reset_token_expiry, 
			COALESCE(login_attempts, 0), locked_until, created_at
		FROM users
		WHERE verification_token = $1
	`
	return r.scanUser(query, hashedToken)
}

func (r *UserRepository) Delete(id string) error {
	query := `DELETE FROM users WHERE id = $1`
	_, err := r.db.Exec(context.Background(), query, id)
	return err
}

// Helper to scan a single user
func (r *UserRepository) scanUser(query string, args ...interface{}) (*domain.User, error) {
	row := r.db.QueryRow(context.Background(), query, args...)
	u := domain.User{}
	err := row.Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.OrgID, &u.OrgName, &u.Role, &u.LogoURL,
		&u.EmailVerified, &u.VerificationToken, &u.VerificationExpiry,
		&u.ResetTokenUsed, &u.ResetToken, &u.ResetTokenExpiry,
		&u.LoginAttempts, &u.LockedUntil, &u.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return &u, nil
}
