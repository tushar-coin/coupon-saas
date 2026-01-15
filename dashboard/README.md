# CouponFlow Dashboard

A modern React dashboard for managing coupons, teams, and organizations.

## Tech Stack

- **React 19** - UI framework
- **Vite 7** - Build tool & dev server
- **React Router 7** - Routing
- **Zustand** - State management
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **Recharts** - Charts & analytics
- **Zod** - Form validation

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

The app runs at **http://localhost:5173**

## Project Structure

```
dashboard/
├── public/
│   └── vite.svg
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/              # Base components (Button, Badge, etc.)
│   │   ├── Layout.jsx       # Main app layout with sidebar
│   │   ├── Toast.jsx        # Toast notifications
│   │   ├── ConfirmModal.jsx # Confirmation dialogs
│   │   └── CustomSelect.jsx # Custom dropdown
│   ├── pages/               # Route pages
│   │   ├── Dashboard.jsx    # Analytics dashboard
│   │   ├── Coupons.jsx      # Coupon list
│   │   ├── CreateCoupon.jsx # 3-step coupon wizard
│   │   ├── Team.jsx         # Team management
│   │   ├── Settings.jsx     # User settings
│   │   ├── Login.jsx        # Authentication
│   │   ├── Register.jsx     # New account
│   │   ├── ForgotPassword.jsx
│   │   ├── ResetPassword.jsx
│   │   ├── VerifyEmail.jsx
│   │   └── AcceptInvitation.jsx
│   ├── store/               # Zustand stores
│   │   ├── useAuthStore.js  # Auth state & actions
│   │   ├── useCouponStore.js# Coupon CRUD
│   │   └── useToastStore.js # Notifications
│   ├── styles/              # CSS files
│   ├── App.jsx              # Route definitions
│   └── main.jsx             # Entry point
├── index.html
├── package.json
└── vite.config.js
```

## Features

### Authentication
- Login with email, password, org name
- Registration with email verification
- Password reset flow
- Account lockout protection

### Coupon Management
- Create coupons with 3-step wizard
- Percentage or fixed discounts
- Usage limits & expiry dates
- Public/private visibility
- Real-time validation

### Team Management
- Invite team members via email
- Role-based permissions (Owner/Admin/Member)
- Accept invitations with password setup
- Remove members & update roles

### UI/UX
- Dark mode support
- Responsive design
- Toast notifications
- Animated transitions
- Custom form components

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## API Configuration

The API URL is configured in stores:

```javascript
// src/store/useAuthStore.js
const API_URL = 'http://localhost:8081/api/v1';
```

For production, update to your deployed backend URL.

## State Management

Using Zustand for lightweight state:

```javascript
// Access auth state
import useAuthStore from './store/useAuthStore';
const { user, isAuthenticated, login, logout } = useAuthStore();

// Access coupons
import useCouponStore from './store/useCouponStore';
const { coupons, addCoupon, deleteCoupon } = useCouponStore();
```

## Protected Routes

Routes under `/` require authentication:

```jsx
<Route element={<ProtectedRoute />}>
  <Route path="/" element={<Layout />}>
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="coupons" element={<Coupons />} />
    <Route path="team" element={<Team />} />
    <Route path="settings" element={<Settings />} />
  </Route>
</Route>
```
