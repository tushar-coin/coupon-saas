# CouponFlow Dashboard

A modern, responsive, and aesthetically premium SaaS dashboard for managing coupons and discounts. Built with React, Vite, and Framer Motion.

![Dashboard Preview](https://via.placeholder.com/800x450?text=Dashboard+Preview)

## 🚀 Features

-   **Interactive Dashboard**: Real-time stats with sparkline trends and animated counters.
-   **Coupon Management**: Create, edit, and track coupons with detailed filtering.
-   **Smart Wizard**: Step-by-step coupon creation wizard with validation (Zod).
-   **Dark Mode**: A polished, "Slate" based dark theme with smooth transitions.
-   **Modern UI**: Glassmorphism effects, fluid animations (Framer Motion), and responsive design.

## 🛠️ Tech Stack

-   **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
-   **Styling**: Pure CSS (Variables for theming) + Lucide Icons
-   **State Management**: [Zustand](https://github.com/pmndrs/zustand) (with persistence)
-   **Animations**: [Framer Motion](https://www.framer.com/motion/)
-   **Forms & Validation**: React Hook Form / Standard Controlled Inputs + [Zod](https://zod.dev/)
-   **Charts**: Custom Sparklines + Recharts (optional future integration)
-   **Utilities**: date-fns, canvas-confetti

## 📦 Installation & Setup

Follow these steps to run the project locally.

### Prerequisites

-   **Node.js**: Version 18.0.0 or higher recommended.
-   **npm**: Comes with Node.js.

### Steps

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/coupon-saas.git
    cd coupon-saas/dashboard
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```
    The application will startup at `http://localhost:5173`.

## 🏗️ Build for Production

To create a production-ready build:

```bash
npm run build
```

To preview the build locally:

```bash
npm run preview
```

## 📂 Project Structure

```
src/
├── components/   # Reusable UI components (Button, Badge, etc.)
├── data/         # Mock data for coupons
├── pages/        # Main route pages (Dashboard, Coupons, etc.)
├── store/        # Zustand stores for state management
├── styles/       # CSS modules and enhanced styling
├── App.jsx       # Main application entry
└── main.jsx      # React DOM root
```

## 🎨 Theming

All colors are defined in `src/index.css` using CSS variables. The app supports system-preference based dark mode detection and manual toggling.

---

**Happy Coding!**
