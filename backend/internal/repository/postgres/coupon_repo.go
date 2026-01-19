package postgres

import (
	"context"
	"coupon-backend/internal/domain"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CouponRepository struct {
	db *pgxpool.Pool
}

func NewCouponRepository(db *pgxpool.Pool) *CouponRepository {
	return &CouponRepository{db: db}
}

func (r *CouponRepository) Save(c *domain.Coupon) error {
	query := `
		INSERT INTO coupons (
			id, org_id, org_name, code, description, type, level,
			discount_amount, min_order_amount, max_discount,
			applicable_tags, is_active, visible,
			usage_limit, usage_count, expiry_date, created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7,
			$8, $9, $10,
			$11, $12, $13,
			$14, $15, $16, $17
		)
		ON CONFLICT (id) DO UPDATE SET
			org_id = EXCLUDED.org_id, -- Should not change usually, but safe
			org_name = EXCLUDED.org_name,
			code = EXCLUDED.code,
			description = EXCLUDED.description,
			type = EXCLUDED.type,
			level = EXCLUDED.level,
			discount_amount = EXCLUDED.discount_amount,
			min_order_amount = EXCLUDED.min_order_amount,
			max_discount = EXCLUDED.max_discount,
			applicable_tags = EXCLUDED.applicable_tags,
			is_active = EXCLUDED.is_active,
			visible = EXCLUDED.visible,
			usage_limit = EXCLUDED.usage_limit,
			usage_count = EXCLUDED.usage_count,
			expiry_date = EXCLUDED.expiry_date;
	`
	// Note: We need org_id. domain.Coupon has OrgName but not explicit OrgID in the struct definition I saw!
	// Wait, domain.Coupon has:
	// ID, OrgName, Code...
	// It DOES NOT HAVE OrgID field in the struct I read earlier in step 171!
	// Struct:
	// type Coupon struct {
	// 	ID          string       `json:"id"`
	// 	OrgName     string       `json:"org_name"`
	// ...

	// Issue: My SQL schema requires org_id.
	// If the domain model doesn't carry OrgID, I cannot insert it easily without looking it up.
	// However, `CreateCoupon` in service passes a coupon.
	// If the coupon struct lacks OrgID, I have to find the OrgID by OrgName?
	// Or maybe I update the domain model?
	// Updating domain model affects everywhere.
	// I will lookup OrgID by OrgName in Save() if needed, OR just store NULL if allowed (but my schema says org_id REFERENCES organizations)?
	// Schema: `org_id UUID REFERENCES organizations(id) ON DELETE CASCADE`
	// It is nullable? `org_id UUID REFERENCES...` yes, defaults to nullable unless `NOT NULL`.
	// But `unique_code_per_org` constraint uses it.

	// I will attempt to lookup OrgID from `organizations` table using `OrgName` before inserting.
	// This makes Save slower (2 queries), but maintains integrity.

	var orgID string
	// Find OrgId by Name
	err := r.db.QueryRow(context.Background(), "SELECT id FROM organizations WHERE name=$1", c.OrgName).Scan(&orgID)
	if err != nil {
		// If org not found, we can't link validation constraint.
		// Allow failure or insert with null?
		// Better to fail if OrgName is invalid.
		return errors.New("organization not found for coupon: " + c.OrgName)
	}

	_, err = r.db.Exec(context.Background(), query,
		c.ID, orgID, c.OrgName, c.Code, c.Description, c.Type, c.Level,
		c.DiscountAmount, c.MinOrderAmount, c.MaxDiscount,
		c.ApplicableTags, c.IsActive, c.Visible,
		c.UsageLimit, c.UsageCount, c.ExpiryDate, c.CreatedAt,
	)
	return err
}

func (r *CouponRepository) FindByID(id string) (*domain.Coupon, error) {
	query := `
		SELECT 
			id, org_name, code, description, type, level,
			discount_amount, min_order_amount, max_discount,
			applicable_tags, is_active, visible,
			usage_limit, usage_count, expiry_date, created_at
		FROM coupons
		WHERE id = $1
	`
	return r.scanCoupon(query, id)
}

func (r *CouponRepository) FindByCode(code string) (*domain.Coupon, error) {
	// Finds the first coupon with this code.
	// Warning: If codes are not globally unique, this forces arbitrary selection.
	query := `
		SELECT 
			id, org_name, code, description, type, level,
			discount_amount, min_order_amount, max_discount,
			applicable_tags, is_active, visible,
			usage_limit, usage_count, expiry_date, created_at
		FROM coupons
		WHERE code = $1
		LIMIT 1
	`
	return r.scanCoupon(query, code)
}

func (r *CouponRepository) FindAll(orgName string) ([]domain.Coupon, error) {
	query := `
		SELECT 
			id, org_name, code, description, type, level,
			discount_amount, min_order_amount, max_discount,
			applicable_tags, is_active, visible,
			usage_limit, usage_count, expiry_date, created_at
		FROM coupons
		WHERE org_name = $1
	`
	rows, err := r.db.Query(context.Background(), query, orgName)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var coupons []domain.Coupon
	for rows.Next() {
		c, err := r.scanRow(rows)
		if err != nil {
			return nil, err
		}
		coupons = append(coupons, *c)
	}
	return coupons, nil
}

func (r *CouponRepository) Update(c *domain.Coupon) error {
	// Re-uses Save logic (Upsert)
	return r.Save(c)
}

func (r *CouponRepository) Delete(id string) error {
	query := `DELETE FROM coupons WHERE id = $1`
	_, err := r.db.Exec(context.Background(), query, id)
	return err
}

// Helpers
func (r *CouponRepository) scanCoupon(query string, args ...interface{}) (*domain.Coupon, error) {
	row := r.db.QueryRow(context.Background(), query, args...)
	c := domain.Coupon{}
	err := row.Scan(
		&c.ID, &c.OrgName, &c.Code, &c.Description, &c.Type, &c.Level,
		&c.DiscountAmount, &c.MinOrderAmount, &c.MaxDiscount,
		&c.ApplicableTags, &c.IsActive, &c.Visible,
		&c.UsageLimit, &c.UsageCount, &c.ExpiryDate, &c.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("coupon not found")
		}
		return nil, err
	}
	return &c, nil
}

func (r *CouponRepository) scanRow(row pgx.Row) (*domain.Coupon, error) {
	c := domain.Coupon{}
	err := row.Scan(
		&c.ID, &c.OrgName, &c.Code, &c.Description, &c.Type, &c.Level,
		&c.DiscountAmount, &c.MinOrderAmount, &c.MaxDiscount,
		&c.ApplicableTags, &c.IsActive, &c.Visible,
		&c.UsageLimit, &c.UsageCount, &c.ExpiryDate, &c.CreatedAt,
	)
	return &c, err
}
