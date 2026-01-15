import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Copy, Home, LogOut, Settings, LayoutDashboard, ChevronLeft, Moon, Sun, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/Layout.css";
import useThemeStore from "../store/useThemeStore";
import useAuthStore from "../store/useAuthStore";

const SIDEBAR_ITEMS = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: LayoutDashboard, label: "Coupons", path: "/coupons" },
  { icon: Users, label: "Team", path: "/team" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const { theme, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore(); // Get User & Logout

  // Apply theme
  if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="brand">
            <Copy size={28} />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="brand-text"
                >
                  CouponFlow
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          
          <button 
            className="sidebar-toggle"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <motion.div
              animate={{ rotate: isCollapsed ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronLeft size={18} />
            </motion.div>
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <div
                key={item.path}
                className="nav-item-wrapper"
                onMouseEnter={() => setHoveredItem(item.path)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Link
                  to={item.path}
                  className={`nav-item ${isActive ? "active" : ""}`}
                >
                  <motion.div
                    className="nav-icon"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <item.icon size={20} />
                  </motion.div>
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="nav-label"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  
                  {isActive && (
                    <motion.div
                      className="active-indicator-line"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "60%", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button 
            className="btn-logout" 
            onClick={toggleTheme}
            style={{ marginBottom: '0.5rem' }}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={20} />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  Sign Out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        <header className="workspace-header">
            <div>
                 <h2 className="page-title">
                    {location.pathname === "/dashboard" ? "Overview" : 
                     location.pathname.includes("coupons") ? "Coupon Management" : 
                     location.pathname.includes("team") ? "Team Management" : "Settings"}
                 </h2>
                 <p className="user-welcome">Welcome back, {user?.org_name || "Merchant"}</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="user-avatar">
                    {user?.org_name ? user.org_name.charAt(0).toUpperCase() : "M"}
                </div>
            </div>
        </header>
        
        <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
