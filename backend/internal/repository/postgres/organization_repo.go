package postgres

import (
	"context"
	"coupon-backend/internal/domain"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type OrganizationRepository struct {
	db *pgxpool.Pool
}

func NewOrganizationRepository(db *pgxpool.Pool) *OrganizationRepository {
	return &OrganizationRepository{db: db}
}

// Save inserts a new organization into the database.
func (r *OrganizationRepository) Save(org *domain.Organization) error {
	query := `
		INSERT INTO organizations (id, name, owner_id, tags, created_at)
		VALUES ($1, $2, $3, $4, $5)`

	// Ensure tags is not nil for Postgres Array compatibility if needed, though lib/pq usually handles nil as NULL
	// But clearer to pass empty slice if that's the intent, or nil for NULL.
	// domain.Organization.Tags is []string.

	_, err := r.db.Exec(context.Background(), query,
		org.ID,
		org.Name,
		org.OwnerID,
		org.Tags,
		org.CreatedAt,
	)
	return err
}

// FindByID retrieves an organization by its ID.
func (r *OrganizationRepository) FindByID(id string) (*domain.Organization, error) {
	query := `SELECT id, name, owner_id, tags, created_at FROM organizations WHERE id = $1`

	row := r.db.QueryRow(context.Background(), query, id)

	var org domain.Organization
	err := row.Scan(&org.ID, &org.Name, &org.OwnerID, &org.Tags, &org.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("organization not found")
		}
		return nil, err
	}

	return &org, nil
}

// FindByName retrieves an organization by its unique name.
func (r *OrganizationRepository) FindByName(name string) (*domain.Organization, error) {
	query := `SELECT id, name, owner_id, tags, created_at FROM organizations WHERE name = $1`

	row := r.db.QueryRow(context.Background(), query, name)

	var org domain.Organization
	err := row.Scan(&org.ID, &org.Name, &org.OwnerID, &org.Tags, &org.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil // Return nil, nil if not found, consistent with some patterns, looking at port interface
		}
		return nil, err
	}

	return &org, nil
}

// Exists checks if an organization with the given name exists.
func (r *OrganizationRepository) Exists(name string) bool {
	query := `SELECT EXISTS(SELECT 1 FROM organizations WHERE name = $1)`
	var exists bool
	err := r.db.QueryRow(context.Background(), query, name).Scan(&exists)
	if err != nil {
		return false
	}
	return exists
}

// Update modifies an existing organization.
func (r *OrganizationRepository) Update(org *domain.Organization) error {
	query := `
		UPDATE organizations 
		SET tags = $1, owner_id = $2
		WHERE id = $3`

	_, err := r.db.Exec(context.Background(), query, org.Tags, org.OwnerID, org.ID)
	return err
}
