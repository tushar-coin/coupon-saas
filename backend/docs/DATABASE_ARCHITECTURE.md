# CouponFlow Database Architecture

## 1. Overview
We have migrated the backend storage from local JSON files to a **PostgreSQL** database hosted on **Supabase**. This provides ACID compliance, scalability, relational integrity, and security.

## 2. Technology Stack
*   **Database**: PostgreSQL 15+ (via Supabase)
*   **Driver**: `pgx/v5` (Go)
*   **Connection Pooling**: `pgxpool`
*   **Migration Management**: SQL scripts in `migrations/`

## 3. Schema Design
The database is normalized to ensure data integrity and minimize redundancy.

### Entity Relationship Diagram (Conceptual)
*   **Organization** (1) ---- (N) **Users**
*   **Organization** (1) ---- (N) **Coupons**
*   **Organization** (1) ---- (N) **Invitations**

### Tables Breakdown

#### `organizations`
The root tenant entity.
*   `id` (UUID, PK): Unique identifier.
*   `name` (VARCHAR, Unique): The tenant's display name.
*   `owner_id`: Reference to the initial creator.

#### `users`
Authenticated accounts belonging to an organization.
*   `id` (UUID, PK)
*   `email` (VARCHAR, Unique)
*   `org_id` (UUID, FK): Links user to their organization. **ON DELETE CASCADE** ensures users are removed if the org is deleted.
*   `password_hash` (VARCHAR): BCrypt hash.
*   **Safety Features**:
    *   `login_attempts`: Tracks failed logins to prevent brute force (locks after 5 attempts).
    *   `locked_until`: Timestamp for account lockout.
    *   `reset_token`: For password recovery flows.

#### `coupons`
The core business entity.
*   `id` (UUID, PK)
*   `code` (VARCHAR): The discount code (e.g., "SAVE20").
*   `org_id` (UUID, FK): Multi-tenant scoping.
*   **Constraints**:
    *   `UNIQUE(org_id, code)`: Ensures a code like "WELCOME" can exist in "Org A" and "Org B" simultaneously, but not twice in "Org A".
    *   `CHECK (type IN ('percentage', 'fixed'))`: Enforces valid discount types at the DB level.

#### `invitations`
Pending team invites.
*   `token` (VARCHAR, Unique): Secure token sent via email.
*   `expires_at`: Enforces security time-limits on links.

## 4. Supabase Integration Details

### Connection Configuration
We use the **Transaction Pooler** (Port 6543) provided by Supabase for better connection management in serverless environments.

**Critical Config:**
Supabase's Transaction Pooler does *not* support Prepared Statements. We must forcefully disable them in `pgx`:
```go
config.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol
```
*Ref: `internal/db/db.go`*

### Environment Variables
Required in `.env`:
```bash
DATABASE_URL="postgres://user.pooler_supabase_id:pass@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

## 5. Go Implementation Details

### Repository Pattern
We implement the `ports` interfaces in `internal/repository/postgres/`.
*   **Code Location**: `internal/repository/postgres/`
*   **Dependency Injection**: Repositories are injected into Services in `main.go`.

### Handling NULLs
PostgreSQL allows `NULL` for optional fields (like `logo_url`), but Go strings cannot be `nil`.
**Solution**: We use `COALESCE` in SQL queries to guarantee a value is returned:
```sql
SELECT COALESCE(logo_url, '') FROM users ...
```
This prevents runtime panics during data scanning.

## 6. Migration History
1.  **Initial Logic**: `migrations/001_initial_schema.sql`
2.  **Auth Fixes**: `migrations/002_fix_auth_columns.sql` (Added lockout/reset columns)
3.  **Data Import**: A custom Go script (`cmd/migrate_data/main.go`) was used to port legacy JSON data to Postgres.
