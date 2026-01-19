# Backend Technical Architecture Guide

This document provides an in-depth explanation of how the CouponFlow backend is designed and how data flows through the system.

---

## Architecture Overview

The backend follows **Clean Architecture** principles with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                        HTTP Layer                               │
│                    (cmd/server/main.go)                        │
│  - Route registration                                          │
│  - Middleware chain                                            │
│  - CORS handling                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Handler Layer                             │
│              (internal/handler/*.go)                           │
│  - Request parsing (JSON decode)                               │
│  - Input validation                                            │
│  - Response formatting                                         │
│  - HTTP status codes                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Service Layer                             │
│              (internal/service/*.go)                           │
│  - Business logic                                              │
│  - Cross-cutting operations                                    │
│  - JWT generation & validation                                 │
│  - Password hashing                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Repository Layer                             │
│      (internal/repository/postgres/*.go)                       │
│  - Data persistence (PostgreSQL)                               │
│  - SQL Queries (pgx/v5)                                        │
│  - Connection Pooling                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Storage                               │
│                 (PostgreSQL / Supabase)                         │
│  - users table                                                 │
│  - organizations table                                         │
│  - coupons table                                               │
│  - invitations table                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layer Details

### 1. Domain Layer (`internal/domain/`)

Contains pure business entities with no external dependencies.

**Files:**
- `coupon.go` - Coupon entity with discount types (percentage/fixed)
- `user.go` - User with roles, auth tokens, lockout fields
- `organization.go` - Multi-tenant organization
- `invitation.go` - Team invitation with token

**Key Design:**
```go
// domain/user.go
type User struct {
    ID           string   // UUID
    Email        string
    OrgID        string   // FK to Organization
    OrgName      string   // Denormalized for quick access (if needed)
    Role         string   // "owner" | "admin" | "member"
    PasswordHash string
    // Security fields
    LoginAttempts int       // Account lockout counter
    LockedUntil   *time.Time
    // Verification fields
    EmailVerified       bool
    VerificationToken   string    // Hashed
    VerificationExpiry  *time.Time
    ResetToken          string    // Hashed
    ResetTokenExpiry    *time.Time
    ResetTokenUsed      bool
}
```

---

### 2. Ports Layer (`internal/ports/`)

Defines interfaces that repositories must implement. This **decouples business logic from storage**.

```go
// ports/repository.go
type UserRepository interface {
    Save(user *domain.User) error
    FindByID(id string) (*domain.User, error)
    FindByEmailAndOrg(email, orgName string) (*domain.User, error)
    FindByOrgID(orgID string) ([]domain.User, error)
    FindByResetToken(hashedToken string) (*domain.User, error)
    FindByVerificationToken(hashedToken string) (*domain.User, error)
    Delete(id string) error
}
```

**Benefits:**
- Services depend on interfaces, not implementations
- Easy to swap specific database implementations
- Testable with mocks

---

### 3. Repository Layer (`internal/repository/postgres/`)

Implements ports using **PostgreSQL** via `pgx/v5` and `pgxpool`.

**Features:**
1.  **Connection Pooling:** Efficiently manages DB connections.
2.  **Transactions:** Supports atomic operations where needed.
3.  **SQL Migrations:** Schema managed via SQL files in `migrations/`.
4.  **Supabase Compatibility:** Configured for Transaction Pooler (Simple Protocol).

```go
// repository/postgres/coupon_repo.go
type PostgresCouponRepository struct {
    db *pgxpool.Pool
}

func (r *PostgresCouponRepository) Save(coupon *domain.Coupon) error {
    query := `
        INSERT INTO coupons (id, org_id, code, ...)
        VALUES ($1, $2, $3, ...)
        ON CONFLICT (id) DO UPDATE SET ...`
    
    _, err := r.db.Exec(context.Background(), query, coupon.ID, coupon.OrgID, ...)
    return err
}
```

**Multi-Tenancy:**
Queries ensure data isolation by strictly filtering by `org_id` (derived from `OrgName` or context).

```go
func (r *PostgresCouponRepository) FindAll(orgName string) ([]domain.Coupon, error) {
    // 1. Resolve OrgID from OrgName
    // 2. Query coupons by org_id
    query := `SELECT ... FROM coupons WHERE org_id = $1`
    // ...
}
```

---

### 4. Service Layer (`internal/service/`)

Contains business logic. Depends only on `ports.Repository` interfaces.

**AuthService** (`auth.go`):
- Registration (creates org + owner user)
- Login (validates password, generates JWT)
- Account lockout (5 attempts → 15 min lock)
- Email verification
- Password reset

**TeamService** (`team.go`):
- Invite users (generates hashed token)
- Accept invitations (creates user account)
- List members by org
- Role management

**ComputationService** (`compute.go`):
- Coupon discount calculation
- Cart-level vs tag-level discounts
- Percentage vs fixed discounts

---

### 5. Handler Layer (`internal/handler/`)

HTTP request/response handling. No business logic here.

**Responsibilities:**
1. Parse JSON request body
2. Extract auth context (user_id, org_id, role)
3. Call service methods
4. Return JSON response with status code

```go
// handler/http_handler.go
func (h *Handler) CreateCoupon(w http.ResponseWriter, r *http.Request) {
    // 1. Get org from JWT context
    orgName := r.Context().Value("org_name").(string)
    
    // 2. Parse request
    var coupon domain.Coupon
    json.NewDecoder(r.Body).Decode(&coupon)
    
    // 3. Set defaults
    coupon.ID = uuid.New().String()
    coupon.OrgName = orgName
    coupon.CreatedAt = time.Now()
    
    // 4. Call service
    err := h.svc.CreateCoupon(&coupon)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    
    // 5. Return response
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(coupon)
}
```

---

### 6. Entry Point (`cmd/server/main.go`)

Wires everything together:

```go
func main() {
    // 1. Initialize Database
    dbPool, err := db.NewPG(os.Getenv("DATABASE_URL"))
    if err != nil {
        log.Fatal(err)
    }
    defer dbPool.Close()

    // 2. Initialize Repositories (Postgres)
    orgRepo := postgres.NewOrganizationRepository(dbPool)
    userRepo := postgres.NewUserRepository(dbPool)
    couponRepo := postgres.NewCouponRepository(dbPool, orgRepo)
    inviteRepo := postgres.NewInvitationRepository(dbPool, orgRepo)

    // 3. Initialize Services
    computeSvc := service.NewComputationService(couponRepo)
    authSvc := service.NewAuthService(userRepo, orgRepo)
    teamSvc := service.NewTeamService(userRepo, orgRepo, inviteRepo)

    // 4. Initialize Handlers
    h := handler.NewHandler(computeSvc)
    authH := handler.NewAuthHandler(authSvc)
    // ...

    // 5. Start Server
    http.ListenAndServe(":8081", h.EnableCORS(mux))
}
```

---

## Request Flow Example

**Creating a Coupon:**

```
1. [Frontend] POST /api/v1/dashboard/coupons
   Headers: Authorization: Bearer <jwt>
   Body: { "code": "SAVE20", "type": "percentage", ... }
   
2. [Middleware] AuthMiddleware
   - Extract JWT from header
   - Verify signature & expiry
   - Inject user_id, org_id, org_name, role into context
   
3. [Handler] CreateCoupon()
   - Read org_name from context
   - Parse JSON body → domain.Coupon
   - Set ID, CreatedAt, OrgName
   - Call service.CreateCoupon()
   
4. [Service] CreateCoupon()
   - Check code uniqueness within org
   - Call repository.Save()
   
5. [Repository] Save()
   - Execute SQL INSERT via pgxpool
   - Handle database constraints (e.g., unique code per org)
   
6. [Handler] Return 201 Created + coupon JSON
```

---

## Security Implementation

### Token Hashing
All tokens (verification, reset, invitation) are hashed before storage:

```go
func hashToken(token string) string {
    hash := sha256.Sum256([]byte(token))
    return hex.EncodeToString(hash[:])
}
```

### Password Storage
bcrypt with default cost (10 rounds).

### Account Lockout
- **LoginAttempts**: Tracked in `users` table.
- **LockedUntil**: Timestamp in `users` table.
- **Logic**: 5 failed attempts locks account for 15 minutes.

---

## Multi-Tenancy Model

Each organization is isolated:

1.  **Database**: All tables (`users`, `coupons`, etc.) have an `org_id` column.
2.  **Foreign Keys**: Enforce relationship to `organizations` table.
3.  **App Logic**: All queries filter by `org_id` derived from the logged-in user's token.

```
Organization A (BurgerKing) [UUID: 123...]
├── Owner: alice@burgerking.com
├── Coupons: BURGER10
└── Cannot see Organization B's data

Organization B (PizzaHut) [UUID: 456...]
├── Owner: carol@pizzahut.com
├── Coupons: PIZZA15
└── Cannot see Organization A's data
```

---

## Database Schema

Refer to `docs/DATABASE_ARCHITECTURE.md` for full schema details.

**Key Tables:**
- `organizations`: Tenant root.
- `users`: Members of organizations.
- `coupons`: Discount rules.
- `invitations`: Pending team members.

---

## CI/CD Pipeline

A GitHub Actions workflow automates building, testing, and containerizing the backend.

```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.24'
      - name: Install dependencies
        run: go mod download
      - name: Run tests
        run: go test ./...
      - name: Build binary
        run: go build -o server ./cmd/server
```

