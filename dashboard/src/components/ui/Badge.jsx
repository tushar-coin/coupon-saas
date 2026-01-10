import { Check, Clock, Pause, X } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import "./Badge.css";

const STATUS_CONFIG = {
  Active: {
    icon: Check,
    color: "success",
    pulse: true,
    tooltip: "This coupon is currently active and available for use"
  },
  Paused: {
    icon: Pause,
    color: "warning",
    pulse: false,
    tooltip: "This coupon has been temporarily paused"
  },
  Expired: {
    icon: Clock,
    color: "muted",
    pulse: false,
    tooltip: "This coupon has expired and is no longer valid"
  },
  Public: {
    icon: Check,
    color: "success",
    pulse: false,
    tooltip: "Visible to all users"
  },
  Influencer: {
    icon: null,
    color: "warning",
    pulse: false,
    tooltip: "Only visible to specific users"
  }
};

export default function Badge({ 
  children, 
  variant = "default", 
  status,
  showIcon = false,
  showTooltip = false,
  className = ""
}) {
  const [isHovered, setIsHovered] = useState(false);
  
  // If status is provided, use status config
  const config = status ? STATUS_CONFIG[status] : null;
  const Icon = config?.icon;
  const shouldPulse = config?.pulse;
  const badgeColor = config?.color || variant;

  return (
    <div 
      className="badge-wrapper"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.span
        className={`badge badge-${badgeColor} ${shouldPulse ? 'badge-pulse' : ''} ${className}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {showIcon && Icon && (
          <motion.div
            className="badge-icon"
            initial={{ rotate: -10, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <Icon size={12} />
          </motion.div>
        )}
        {children || status}
      </motion.span>

      {/* Tooltip */}
      {showTooltip && config?.tooltip && isHovered && (
        <motion.div
          className="badge-tooltip"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.15 }}
        >
          {config.tooltip}
        </motion.div>
      )}
    </div>
  );
}
