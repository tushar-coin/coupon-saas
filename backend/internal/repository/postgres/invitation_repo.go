package postgres

import (
	"context"
	"coupon-backend/internal/domain"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type InvitationRepository struct {
	db *pgxpool.Pool
}

func NewInvitationRepository(db *pgxpool.Pool) *InvitationRepository {
	return &InvitationRepository{db: db}
}

func (r *InvitationRepository) Save(inv *domain.Invitation) error {
	query := `
		INSERT INTO invitations (
			id, org_id, org_name, email, role, token, invited_by,
			expires_at, accepted_at, created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7,
			$8, $9, $10
		)
		ON CONFLICT (id) DO UPDATE SET
			org_id = EXCLUDED.org_id, -- assuming org_id doesn't change
			org_name = EXCLUDED.org_name,
			email = EXCLUDED.email,
			role = EXCLUDED.role,
			token = EXCLUDED.token,
			invited_by = EXCLUDED.invited_by,
			expires_at = EXCLUDED.expires_at,
			accepted_at = EXCLUDED.accepted_at;
	`
	_, err := r.db.Exec(context.Background(), query,
		inv.ID, inv.OrgID, inv.OrgName, inv.Email, inv.Role, inv.Token, inv.InvitedBy,
		inv.ExpiresAt, inv.AcceptedAt, inv.CreatedAt,
	)
	return err
}

func (r *InvitationRepository) FindByToken(hashedToken string) (*domain.Invitation, error) {
	query := `
		SELECT 
			id, org_id, org_name, email, role, token, invited_by,
			expires_at, accepted_at, created_at
		FROM invitations
		WHERE token = $1
	`
	return r.scanInvitation(query, hashedToken)
}

func (r *InvitationRepository) FindByOrgID(orgID string) ([]domain.Invitation, error) {
	query := `
		SELECT 
			id, org_id, org_name, email, role, token, invited_by,
			expires_at, accepted_at, created_at
		FROM invitations
		WHERE org_id = $1
	`
	rows, err := r.db.Query(context.Background(), query, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var invitations []domain.Invitation
	for rows.Next() {
		inv, err := r.scanRow(rows)
		if err != nil {
			return nil, err
		}
		invitations = append(invitations, *inv)
	}
	return invitations, nil
}

func (r *InvitationRepository) FindPendingByEmail(email string) ([]domain.Invitation, error) {
	query := `
		SELECT 
			id, org_id, org_name, email, role, token, invited_by,
			expires_at, accepted_at, created_at
		FROM invitations
		WHERE email = $1 AND accepted_at IS NULL AND expires_at > NOW()
	`
	rows, err := r.db.Query(context.Background(), query, email)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var invitations []domain.Invitation
	for rows.Next() {
		inv, err := r.scanRow(rows)
		if err != nil {
			return nil, err
		}
		invitations = append(invitations, *inv)
	}
	return invitations, nil
}

func (r *InvitationRepository) Delete(id string) error {
	query := `DELETE FROM invitations WHERE id = $1`
	_, err := r.db.Exec(context.Background(), query, id)
	return err
}

// Helpers
func (r *InvitationRepository) scanInvitation(query string, args ...interface{}) (*domain.Invitation, error) {
	row := r.db.QueryRow(context.Background(), query, args...)
	inv := domain.Invitation{}
	err := row.Scan(
		&inv.ID, &inv.OrgID, &inv.OrgName, &inv.Email, &inv.Role, &inv.Token, &inv.InvitedBy,
		&inv.ExpiresAt, &inv.AcceptedAt, &inv.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("invitation not found")
		}
		return nil, err
	}
	return &inv, nil
}

func (r *InvitationRepository) scanRow(row pgx.Row) (*domain.Invitation, error) {
	inv := domain.Invitation{}
	// Note: invited_by can be NULL in DB but string in struct.
	// If it is NULL, Scan might fail if struct field is string.
	// We should handle nullable invited_by.
	// Struct has InvitedBy string.
	// If standard Scan is used on NULL, it errors.
	// Creating a temporary sql.NullString or just pointer?
	// pgx handles *string for nullable text.

	var invitedBy *string
	err := row.Scan(
		&inv.ID, &inv.OrgID, &inv.OrgName, &inv.Email, &inv.Role, &inv.Token, &invitedBy,
		&inv.ExpiresAt, &inv.AcceptedAt, &inv.CreatedAt,
	)
	if invitedBy != nil {
		inv.InvitedBy = *invitedBy
	}
	return &inv, err
}
