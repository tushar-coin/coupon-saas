# CouponFlow Dashboard

A modern React dashboard for managing coupons, teams, and organizations.

## Tech Stack

- **React 19** – UI framework
- **Vite 7** – Build tool & dev server
- **React Router 7** – Routing
- **Zustand** – State management
- **Framer Motion** – Animations
- **Lucide React** – Icons
- **Recharts** – Charts & analytics
- **Zod** – Form validation
- **Tailwind CSS** – (optional) styling framework

## Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn
- Backend server running at `http://localhost:8081`

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd coupon-saas/dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

The app runs at **http://localhost:5173**.

## Project Structure

```text
dashboard/
├── public/
│   └── vite.svg
├── src/
│   ├── components/
│   │   ├── ui/                # Base UI components (Button, Badge, etc.)
│   │   ├── Layout.jsx         # Main layout with sidebar
│   │   ├── Toast.jsx          # Toast notifications
│   │   ├── ConfirmModal.jsx   # Confirmation dialogs
│   │   └── CustomSelect.jsx   # Custom dropdown
│   ├── pages/
│   │   ├── Dashboard.jsx      # Analytics dashboard
│   │   ├── Coupons.jsx        # Coupon list
│   │   ├── CreateCoupon.jsx   # 3‑step coupon wizard
│   │   ├── Team.jsx           # Team management
│   │   ├── Settings.jsx       # User settings
│   │   ├── Login.jsx          # Authentication
│   │   ├── Register.jsx       # New account
│   │   ├── ForgotPassword.jsx
│   │   ├── ResetPassword.jsx
│   │   ├── VerifyEmail.jsx
│   │   └── AcceptInvitation.jsx
│   ├── store/
│   │   ├── useAuthStore.js    # Auth state & actions
│   │   ├── useCouponStore.js  # Coupon CRUD
│   │   └── useToastStore.js   # Notifications
│   ├── styles/                # CSS files
│   ├── App.jsx                # Route definitions
│   └── main.jsx               # Entry point
├── index.html
├── package.json
└── vite.config.js
```

## Features

### Authentication
- Login with email, password, and organization name
- Registration with email verification
- Password reset flow
- Account lockout protection

### Coupon Management
- Create coupons with a 3‑step wizard
- Percentage or fixed discounts
- Usage limits & expiry dates
- Public/private visibility
- Real‑time validation and inline errors

### Team Management
- Invite team members via email
- Role‑based permissions (Owner/Admin/Member)
- Accept invitations with password setup
- Remove members & update roles

### UI/UX
- Dark mode support with CSS variables
- Responsive design for mobile & desktop
- Toast notifications for feedback
- Animated transitions using Framer Motion
- Custom form components with floating labels

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
npm run test     # Run Jest & React Testing Library tests
```

## API Configuration

The API URL is configured in stores:

```javascript
// src/store/useAuthStore.js
const API_URL = 'http://localhost:8081/api/v1';
```

For production, update to your deployed backend URL.

## Testing

Unit and integration tests are located alongside components using **Jest** and **React Testing Library**. Run `npm test` to execute all tests.

## CI/CD Pipeline

A GitHub Actions workflow builds the frontend, runs linting and tests, and deploys the static site to **Vercel** (or any static hosting). See `.github/workflows/ci.yml` for details.

## Deployment

The dashboard can be deployed as a static site (e.g., Vercel, Netlify) or served via a CDN. Ensure the `API_URL` environment variable points to the production backend.
