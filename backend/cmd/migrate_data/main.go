package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"

	"coupon-backend/internal/domain"
)

const TargetOrgName = "MuscleBlaze"

func main() {
	// 1. Load Env
	if err := godotenv.Load("../../.env"); err != nil {
		log.Println("Warning: .env not found in ../../.env, trying current dir")
		_ = godotenv.Load()
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	// 2. Connect to DB
	ctx := context.Background()
	conn, err := pgx.Connect(ctx, dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	defer conn.Close(ctx)

	log.Printf("Connected to Database. Starting Migration for Organization: %s...", TargetOrgName)

	// 3. Migrate Organizations first (Parent)
	if err := migrateOrganizations(ctx, conn); err != nil {
		log.Fatalf("Failed to migrate orgs: %v", err)
	}

	// 4. Migrate Users (Children of Orgs)
	if err := migrateUsers(ctx, conn); err != nil {
		log.Fatalf("Failed to migrate users: %v", err)
	}

	// 5. Migrate Coupons
	if err := migrateCoupons(ctx, conn); err != nil {
		log.Fatalf("Failed to migrate coupons: %v", err)
	}

	// 6. Migrate Invitations
	if err := migrateInvitations(ctx, conn); err != nil {
		log.Fatalf("Failed to migrate invites: %v", err)
	}

	log.Println("🎉 Migration Complete Successfully!")
}

func readJSON(file string, dest interface{}) error {
	data, err := os.ReadFile(file)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, dest)
}

func migrateOrganizations(ctx context.Context, conn *pgx.Conn) error {
	var orgs []domain.Organization
	path := "data/organizations.json"

	if err := readJSON(path, &orgs); err != nil {
		return fmt.Errorf("reading orgs: %w", err)
	}

	count := 0
	for _, o := range orgs {
		if o.Name != TargetOrgName {
			continue
		}

		_, err := conn.Exec(ctx, `
			INSERT INTO organizations (id, name, owner_id, tags, created_at)
			VALUES ($1, $2, $3, $4, $5)
			ON CONFLICT (id) DO NOTHING`,
			o.ID, o.Name, o.OwnerID, o.Tags, o.CreatedAt)
		if err != nil {
			return fmt.Errorf("insert org %s: %w", o.Name, err)
		}
		count++
	}
	log.Printf("Migrated %d Organizations (Filtered for %s)", count, TargetOrgName)
	return nil
}

func migrateUsers(ctx context.Context, conn *pgx.Conn) error {
	var users []domain.User
	path := "data/users.json"
	if err := readJSON(path, &users); err != nil {
		return fmt.Errorf("reading users: %w", err)
	}

	count := 0
	for _, u := range users {
		if u.OrgName != TargetOrgName {
			continue
		}

		_, err := conn.Exec(ctx, `
			INSERT INTO users (
				id, email, password_hash, org_id, org_name, role, logo_url,
				email_verified, verification_token, verification_expiry,
				reset_token_used, created_at
			) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
			ON CONFLICT (id) DO NOTHING`,
			u.ID, u.Email, u.PasswordHash, u.OrgID, u.OrgName, u.Role, u.LogoURL,
			u.EmailVerified, u.VerificationToken, u.VerificationExpiry,
			u.ResetTokenUsed, u.CreatedAt,
		)
		if err != nil {
			return fmt.Errorf("insert user %s: %w", u.Email, err)
		}
		count++
	}
	log.Printf("Migrated %d Users (Filtered for %s)", count, TargetOrgName)
	return nil
}

func migrateCoupons(ctx context.Context, conn *pgx.Conn) error {
	var coupons []domain.Coupon
	path := "data/coupons.json"
	if err := readJSON(path, &coupons); err != nil {
		return fmt.Errorf("reading coupons: %w", err)
	}

	count := 0
	for _, c := range coupons {
		if c.OrgName != TargetOrgName {
			continue
		}

		// Look up OrgID
		var orgID string
		err := conn.QueryRow(ctx, "SELECT id FROM organizations WHERE name=$1", c.OrgName).Scan(&orgID)
		if err != nil {
			log.Printf("Skipping coupon %s: Org %s not found in DB", c.Code, c.OrgName)
			continue
		}

		_, err = conn.Exec(ctx, `
			INSERT INTO coupons (
				id, org_id, org_name, code, description, type, level,
				discount_amount, min_order_amount, max_discount,
				applicable_tags, is_active, visible,
				usage_limit, usage_count, expiry_date, created_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
			ON CONFLICT (id) DO NOTHING`,
			c.ID, orgID, c.OrgName, c.Code, c.Description, c.Type, c.Level,
			c.DiscountAmount, c.MinOrderAmount, c.MaxDiscount,
			c.ApplicableTags, c.IsActive, c.Visible,
			c.UsageLimit, c.UsageCount, c.ExpiryDate, c.CreatedAt,
		)
		if err != nil {
			log.Printf("Error inserting coupon %s: %v", c.Code, err)
		} else {
			count++
		}
	}
	log.Printf("Migrated %d Coupons (Filtered for %s)", count, TargetOrgName)
	return nil
}

func migrateInvitations(ctx context.Context, conn *pgx.Conn) error {
	var invites []domain.Invitation
	path := "data/invitations.json"
	if err := readJSON(path, &invites); err != nil {
		return fmt.Errorf("reading invitations: %w", err)
	}

	count := 0
	for _, i := range invites {
		if i.OrgName != TargetOrgName {
			continue
		}

		_, err := conn.Exec(ctx, `
			INSERT INTO invitations (
				id, org_id, org_name, email, role, token, invited_by,
				expires_at, accepted_at, created_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			ON CONFLICT (id) DO NOTHING`,
			i.ID, i.OrgID, i.OrgName, i.Email, i.Role, i.Token, i.InvitedBy,
			i.ExpiresAt, i.AcceptedAt, i.CreatedAt,
		)
		if err != nil {
			log.Printf("Error inserting invite %s: %v", i.Email, err)
		} else {
			count++
		}
	}
	log.Printf("Migrated %d Invitations (Filtered for %s)", count, TargetOrgName)
	return nil
}
