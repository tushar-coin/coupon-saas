# CouponFlow Backend

A Go-based REST API server for the CouponFlow coupon management platform.

## Tech Stack

- **Go 1.24+** - Core language
- **JWT (golang-jwt/v5)** - Authentication
- **bcrypt** - Password hashing
- **UUID** - Unique identifiers
- **JSON Files** - Data persistence (development)

## Quick Start

### Prerequisites

- Go 1.24 or higher installed
- Git

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd coupon-saas/backend

# Install dependencies
go mod download

# Start the server
go run cmd/server/main.go
```

The server runs at **http://localhost:8081**

## Project Structure

```
backend/
├── cmd/
│   └── server/
│       └── main.go          # Entry point, route registration
├── data/                    # JSON data files (gitignored in prod)
│   ├── users.json
│   ├── organizations.json
│   ├── coupons.json
│   ├── invitations.json
│   └── uploads/             # Logo uploads
├── internal/
│   ├── domain/              # Business entities
│   │   ├── coupon.go
│   │   ├── user.go
│   │   ├── organization.go
│   │   └── invitation.go
│   ├── handler/             # HTTP handlers
│   │   ├── http_handler.go  # Coupon endpoints
│   │   ├── auth_handler.go  # Auth endpoints
│   │   └── team_handler.go  # Team management
│   ├── ports/               # Repository interfaces
│   │   └── repository.go
│   ├── repository/          # Data access layer
│   │   └── jsonrepo/        # JSON file implementations
│   └── service/             # Business logic
│       ├── auth.go          # Authentication
│       ├── compute.go       # Coupon logic
│       └── team.go          # Team management
└── go.mod
```

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/api/v1/public/compute` | Compute coupon discount |

### Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Create account + organization |
| POST | `/api/v1/auth/login` | Login (returns JWT) |
| GET | `/api/v1/auth/verify-email` | Verify email token |
| POST | `/api/v1/auth/forgot-password` | Request password reset |
| POST | `/api/v1/auth/reset-password` | Reset password with token |
| POST | `/api/v1/auth/upload-logo` | Upload user/org logo |

### Protected Endpoints (Require JWT)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/dashboard/coupons` | List org coupons |
| POST | `/api/v1/dashboard/coupons` | Create coupon |
| POST | `/api/v1/team/invite` | Invite team member |
| POST | `/api/v1/team/accept-invitation` | Accept invite |
| GET | `/api/v1/team/members` | List team members |
| GET | `/api/v1/team/invitations` | List pending invites |
| PUT | `/api/v1/team/members/{id}/role` | Update member role |
| DELETE | `/api/v1/team/members/{id}` | Remove member |
| DELETE | `/api/v1/team/invitations/{id}` | Cancel invitation |

## Authentication

JWT tokens are used for authentication. Include in requests:

```
Authorization: Bearer <token>
```

**Token Claims:**
- `user_id` - User's unique ID
- `org_id` - Organization ID
- `org_name` - Organization name
- `role` - User role (owner/admin/member)
- `exp` - Expiry (24 hours)

## Security Features

- ✅ Password hashing (bcrypt)
- ✅ Account lockout (5 failed attempts → 15 min lock)
- ✅ Email verification tokens (hashed, 24h expiry)
- ✅ Password reset tokens (hashed, 15 min expiry)
- ✅ Role-based access control
- ✅ Multi-tenant isolation (org-scoped data)

## Environment Variables

For production, set:

```bash
JWT_SECRET=your-super-secret-key-here
```

## Development

```bash
# Build
go build -o server ./cmd/server

# Run tests
go test ./...

# Format code
go fmt ./...
```
