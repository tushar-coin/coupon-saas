package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	// 1. Load Env
	if err := godotenv.Load("../../.env"); err != nil {
		fmt.Println("Note: .env not found in ../../.env, trying current dir")
		_ = godotenv.Load()
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	// 2. Connect
	ctx := context.Background()
	// Fix for Supabase Transaction Pooler: Disable Prepared Statements
	config, err := pgx.ParseConfig(dbURL)
	if err != nil {
		log.Fatalf("Unable to parse DB URL: %v", err)
	}
	config.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol

	conn, err := pgx.ConnectConfig(ctx, config)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	defer conn.Close(ctx)

	// 3. Inputs (Hardcoded based on your screenshot)
	email := "rajaninvest597@gmail.com"
	orgName := "MuscleBlaze"
	password := "Zordowot@345"

	fmt.Printf("\n🔍 Debugging Login for:\nEmail: %s\nOrg:   %s\nPass:  %s\n", email, orgName, password)

	// 4. Fetch User
	var id, storedHash, storedEmail, storedOrg string
	err = conn.QueryRow(ctx, `
		SELECT id, email, org_name, password_hash 
		FROM users 
		WHERE email=$1 AND org_name=$2`, email, orgName).Scan(&id, &storedEmail, &storedOrg, &storedHash)

	if err != nil {
		if err == pgx.ErrNoRows {
			fmt.Println("\n❌ ERROR: User NOT FOUND in Database.")
			fmt.Println("   Please check exact spelling of Email and OrgName.")

			// Debug: List all users to see what exists
			fmt.Println("\n   Existing Users in DB:")
			rows, _ := conn.Query(ctx, "SELECT email, org_name FROM users")
			defer rows.Close()
			for rows.Next() {
				var e, o string
				rows.Scan(&e, &o)
				fmt.Printf("   - %s (Org: %s)\n", e, o)
			}
			return
		}
		log.Fatalf("Database Error: %v", err)
	}

	fmt.Printf("\n✅ User Found!\n   ID: %s\n   Stored Hash: %s\n", id, storedHash)

	// 5. Compare Password
	err = bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(password))
	if err != nil {
		fmt.Printf("\n❌ Password Verification FAILED: %v\n", err)
		fmt.Println("   The stored hash does not match 'Zordowota345'.")
		fmt.Println("   Possible reason: The hash in JSON was different or corrupted during migration.")
	} else {
		fmt.Println("\n✅ Password Verification SUCCESS!")
		fmt.Println("   The credentials are correct. If login fails in app, check the Auth Service logic.")
	}
}
