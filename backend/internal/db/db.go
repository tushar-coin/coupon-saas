package db

import (
	"context"
	"fmt"
	"log"
	"sync"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	pool *pgxpool.Pool
	once sync.Once
)

// Initialize sets up the database connection pool using the provided connection string.
// It ensures the singleton pool is initialized only once.
func Initialize(connString string) error {
	var err error
	once.Do(func() {
		config, parseErr := pgxpool.ParseConfig(connString)
		if parseErr != nil {
			err = fmt.Errorf("unable to parse database config: %v", parseErr)
			return
		}

		// Fix for Supabase Transaction Pooler (Port 6543): Disable Prepared Statements
		config.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol

		// You can customize pool config here if needed (e.g., MinConns, MaxConns)

		pool, err = pgxpool.NewWithConfig(context.Background(), config)
		if err != nil {
			err = fmt.Errorf("unable to create connection pool: %v", err)
			return
		}

		// Verify connection
		if pingErr := pool.Ping(context.Background()); pingErr != nil {
			err = fmt.Errorf("unable to ping database: %v", pingErr)
			return
		}

		log.Println("Successfully connected to PostgreSQL database")
	})

	return err
}

// GetPool returns the database connection pool.
// It assumes Initialize has been called successfully.
func GetPool() *pgxpool.Pool {
	return pool
}

// Close closes the database connection pool.
func Close() {
	if pool != nil {
		pool.Close()
	}
}
