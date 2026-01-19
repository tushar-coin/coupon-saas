# CouponFlow Backend

A Go-based REST API server for the CouponFlow coupon management platform.

## Tech Stack

- **Go 1.24+** – Core language
- **PostgreSQL 15+** – Primary Database (via Supabase)
- **pgx/v5** – PostgreSQL driver & connection pooling
- **JWT (golang-jwt/v5)** – Authentication
- **bcrypt** – Password hashing
- **UUID** – Unique identifiers

## Quick Start

### Prerequisites

- Go 1.24+
- Git
- PostgreSQL Database (Local or Supabase)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd coupon-saas/backend
   ```

2. **Configure Environment**
   Create a `.env` file in the `backend/` directory:
   ```bash
   cp .env.example .env  # if available, otherwise create new
   ```
   Add your database credentials:
   ```env
   DATABASE_URL=postgres://user:password@host:port/dbname?sslmode=disable
   # For Supabase Transaction Pooler (Session Mode recommended for migration, Transaction for app)
   # DATABASE_URL=postgres://postgres:[YOUR-PASSWORD]@db.xxxxxxxx.supabase.co:5432/postgres
   
   JWT_SECRET=your-super-secret-key
   
   # SMTP Configuration (Optional, for emails)
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_EMAIL=your-email@example.com
   SMTP_PASSWORD=your-email-password
   ```

3. **Install Dependencies**
   ```bash
   go mod download
   ```

4. **Run Migrations (Optional)**
   The schema is managed via SQL files in `migrations/`. You can apply them manually or via a tool if set up.
   ```bash
   # Example manually applying schema
   psql $DATABASE_URL -f migrations/001_initial_schema.sql
   ```

5. **Run the Server**
   ```bash
   go run cmd/server/main.go
   ```
   The server runs at **http://localhost:8081**.

## Project Structure

```text
backend/
├── cmd/
│   ├── server/
│   │   └── main.go          # Entry point
│   ├── migrate_data/        # One-off migration script (JSON -> Postgres)
│   └── debug_login/         # Debugging tools
├── internal/
│   ├── domain/              # Business entities
│   ├── handler/             # HTTP handlers
│   ├── ports/               # Repository interfaces
│   ├── repository/
│   │   └── postgres/        # PostgreSQL implementations (pgx)
│   ├── service/             # Business logic
│   └── db/                  # Database connection setup
├── migrations/              # SQL Schema definitions
└── go.mod
```

## API Endpoints

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/api/v1/public/compute` | Compute discount |

### Auth Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Create account + organization |
| POST | `/api/v1/auth/login` | Login (returns JWT) |
| GET | `/api/v1/auth/verify-email` | Verify email token |

### Protected Endpoints (Require `Authorization: Bearer <token>`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/dashboard/coupons` | List org coupons |
| POST | `/api/v1/dashboard/coupons` | Create coupon |
| START | `/api/v1/team/*` | Team management endpoints |

## Security Features

- ✅ **Secure Storage**: Data stored in PostgreSQL with specific schemas.
- ✅ **Password Hashing**: bcrypt used for all passwords.
- ✅ **Multi-Tenancy**: Data strictly isolated by `org_id`.
- ✅ **Account Lockout**: 5 failed attempts locks account for 15 mins.
- ✅ **Input Sanitization**: SQL parameters prevent injection; Go structs validat input.

## Deployment

Deploy the Go binary handling standard HTTP traffic.
Ensure `DATABASE_URL` is set in the production environment variables.
