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
│      (internal/repository/jsonrepo/*.go)                       │
│  - Data persistence (JSON files)                               │
│  - In-memory caching                                           │
│  - Thread-safe operations (mutex)                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Storage                               │
│                    (data/*.json)                               │
│  - users.json                                                  │
│  - organizations.json                                          │
│  - coupons.json                                                │
│  - invitations.json                                            │
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
    OrgID        string   // Links to Organization
    OrgName      string   // Denormalized for quick access
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
- Easy to swap JSON storage for PostgreSQL/MongoDB later
- Testable with mocks

---

### 3. Repository Layer (`internal/repository/jsonrepo/`)

Implements ports using JSON file storage. Each repository:

1. **Loads data** from file on initialization
2. **Caches in memory** (map by ID)
3. **Flushes to file** on every write
4. **Uses mutex** for thread safety

```go
// repository/jsonrepo/coupon_repo.go
type FileCouponRepository struct {
    mu       sync.RWMutex
    filePath string
    coupons  map[string]domain.Coupon // In-memory cache
}

func (r *FileCouponRepository) Save(coupon *domain.Coupon) error {
    r.mu.Lock()
    defer r.mu.Unlock()
    
    r.coupons[coupon.ID] = *coupon  // Update cache
    return r.flush()                 // Write to file
}
```

**Multi-Tenancy:**
Queries filter by `OrgName` to ensure data isolation:
```go
func (r *FileCouponRepository) FindAll(orgName string) ([]domain.Coupon, error) {
    r.mu.RLock()
    defer r.mu.RUnlock()

    var list []domain.Coupon
    for _, c := range r.coupons {
        if c.OrgName == orgName {  // Org-scoped filter
            list = append(list, c)
        }
    }
    return list, nil
}
```

---

### 4. Service Layer (`internal/service/`)

Contains business logic. Depends only on repository interfaces.

**AuthService** (`auth.go`):
- Registration (creates org + owner user)
- Login (validates password, generates JWT)
- Account lockout (5 attempts → 15 min lock)
- Email verification
- Password reset

```go
func (s *AuthService) Login(req domain.LoginRequest) (*domain.AuthResponse, error) {
    // 1. Find user
    user, err := s.userRepo.FindByEmailAndOrg(req.Email, req.OrgName)
    
    // 2. Check lockout
    if user.LockedUntil != nil && time.Now().Before(*user.LockedUntil) {
        return nil, fmt.Errorf("account locked")
    }
    
    // 3. Verify password
    err = bcrypt.CompareHashAndPassword(...)
    if err != nil {
        user.LoginAttempts++
        if user.LoginAttempts >= 5 {
            user.LockedUntil = now.Add(15 * time.Minute)
        }
        s.userRepo.Save(user)
        return nil, errors.New("invalid credentials")
    }
    
    // 4. Generate JWT
    token := s.generateToken(user)
    return &domain.AuthResponse{Token: token, User: user}, nil
}
```

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

**Auth Middleware:**
```go
func (h *AuthHandler) AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        // 1. Extract Bearer token
        tokenString := r.Header.Get("Authorization")[7:]
        
        // 2. Verify & parse JWT
        claims, err := h.svc.VerifyToken(tokenString)
        
        // 3. Inject into context
        ctx := context.WithValue(r.Context(), "user_id", claims["user_id"])
        ctx = context.WithValue(ctx, "org_id", claims["org_id"])
        ctx = context.WithValue(ctx, "org_name", claims["org_name"])
        ctx = context.WithValue(ctx, "role", claims["role"])
        
        // 4. Continue to handler
        next(w, r.WithContext(ctx))
    }
}
```

---

### 6. Entry Point (`cmd/server/main.go`)

Wires everything together:

```go
func main() {
    // 1. Initialize repositories
    couponRepo := jsonrepo.NewFileCouponRepository("data/coupons.json")
    userRepo := jsonrepo.NewFileUserRepository("data/users.json")
    orgRepo := jsonrepo.NewFileOrganizationRepository("data/organizations.json")
    inviteRepo := jsonrepo.NewFileInvitationRepository("data/invitations.json")

    // 2. Initialize services
    computeSvc := service.NewComputationService(couponRepo)
    authSvc := service.NewAuthService(userRepo, orgRepo)
    teamSvc := service.NewTeamService(userRepo, orgRepo, inviteRepo)

    // 3. Initialize handlers
    h := handler.NewHandler(computeSvc)
    authH := handler.NewAuthHandler(authSvc)
    teamH := handler.NewTeamHandler(teamSvc, authSvc)

    // 4. Register routes
    mux := http.NewServeMux()
    
    // Public
    mux.HandleFunc("POST /api/v1/public/compute", h.ComputeDiscount)
    
    // Auth
    mux.HandleFunc("POST /api/v1/auth/register", authH.Register)
    mux.HandleFunc("POST /api/v1/auth/login", authH.Login)
    
    // Protected (with middleware)
    mux.HandleFunc("GET /api/v1/dashboard/coupons", 
        authH.AuthMiddleware(h.GetAllCoupons))
    mux.HandleFunc("POST /api/v1/team/invite", 
        authH.AuthMiddleware(teamH.InviteUser))

    // 5. Start server with CORS
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
   - Add to in-memory map
   - Write entire map to coupons.json
   
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

The plain token is sent to user (via email). Database stores only the hash.

### Password Storage
bcrypt with default cost (10 rounds):

```go
hashedBytes, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
```

### Account Lockout
```go
const MaxLoginAttempts = 5
const LockoutDuration = 15 * time.Minute

if user.LoginAttempts >= MaxLoginAttempts {
    lockUntil := time.Now().Add(LockoutDuration)
    user.LockedUntil = &lockUntil
}
```

---

## Multi-Tenancy Model

Each organization is isolated:

1. **Registration** → Creates Organization + Owner User
2. **Login** → Requires email + org_name + password
3. **JWT** → Contains org_id, org_name
4. **Queries** → Always filter by org_name

```
Organization A (BurgerKing)
├── Owner: alice@burgerking.com
├── Admin: bob@burgerking.com
├── Coupons: BURGER10, MEAL20
└── Cannot see Organization B's data

Organization B (PizzaHut)
├── Owner: carol@pizzahut.com
├── Coupons: PIZZA15
└── Cannot see Organization A's data
```

---

## Role-Based Access Control

| Permission | Owner | Admin | Member |
|------------|-------|-------|--------|
| Create coupons | ✅ | ✅ | ✅ |
| Delete coupons | ✅ | ✅ | ❌ |
| Invite users | ✅ | ✅ | ❌ |
| Remove users | ✅ | ✅ | ❌ |
| Change roles | ✅ | ❌ | ❌ |
| Delete org | ✅ | ❌ | ❌ |

Checked in handlers:
```go
role := r.Context().Value("role").(string)
if role != "owner" && role != "admin" {
    http.Error(w, "Forbidden", http.StatusForbidden)
    return
}
```

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
      - name: Build Docker image
        run: |
          docker build -t coupon-saas-backend:${{ github.sha }} .
      - name: Push Docker image
        if: github.ref == 'refs/heads/main'
        run: |
          echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
          docker push coupon-saas-backend:${{ github.sha }}
```

## Testing Strategy

- **Unit Tests**: Go tests for each package (`go test ./...`).
- **Integration Tests**: Spin up the server with an in‑memory SQLite DB (or mock JSON repo) and run end‑to‑end API tests using **Postman/Newman** or **Go's net/http/httptest**.
- **Coverage**: Enforce a minimum of 80 % code coverage; fail the CI if below.
- **Static Analysis**: Run `golint` and `go vet` as part of the workflow.

---

