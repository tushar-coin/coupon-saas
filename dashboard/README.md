# CouponFlow Dashboard

A modern React dashboard for managing coupons, teams, and organizations.

## Tech Stack

- **React 19** – UI framework
- **Vite 7** – Build tool & dev server
- **React Router 7** – Routing
- **Zustand** – State management
- **Lucide React** – Icons
- **Tailwind CSS** – Styling

## Quick Start

### Prerequisites

- Node.js 18+
- Backend server running (Go + PostgreSQL)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd coupon-saas/dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment** (Optional)
   The app defaults to `http://localhost:8081`. To change the API URL, create a `.env` file:
   ```env
   VITE_API_URL=http://your-backend-url:8081
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   The app runs at **http://localhost:5173**.

## Project Structure

```text
dashboard/
├── src/
│   ├── components/        # Reusable UI components
│   ├── config/            # App configuration (API URLs)
│   ├── pages/             # Page components
│   ├── store/             # Zustand stores (Auth, Coupons, Toast)
│   ├── styles/            # Global styles
│   ├── App.jsx            # Routes
│   └── main.jsx           # Entry point
└── vite.config.js
```

## Features

- **Authentication**: Login, Register, Forgot Password, Account Lockout handling.
- **Coupon Management**: Create, List, Filter coupons.
- **Team Management**: Invite users, manage roles.
- **Responsive UI**: Works on desktop and mobile.

## API Configuration

The application connects to the backend API defined in `src/config/api.js`.
It uses `import.meta.env.VITE_API_URL` if set, otherwise defaults to `http://localhost:8081`.

## Deployment

Build the application for production:
```bash
npm run build
```
Deploy the `dist/` folder to any static host (Vercel, Netlify, S3).
Ensure the `VITE_API_URL` environment variable is set in your CI/CD or hosting provider.
