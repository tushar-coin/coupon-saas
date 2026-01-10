import { motion } from "framer-motion";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import "./Button.css";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  onClick,
  type = "button",
  className = "",
  ...props
}) {
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    if (loading || disabled) return;

    // Create ripple effect
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple = {
      id: Date.now(),
      x,
      y,
    };

    setRipples((prev) => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== newRipple.id));
    }, 600);

    if (onClick) {
      onClick(e);
    }
  };

  const buttonClass = `
    btn 
    btn-${variant} 
    btn-${size} 
    ${loading ? 'btn-loading' : ''} 
    ${disabled ? 'btn-disabled' : ''} 
    ${className}
  `.trim();

  return (
    <motion.button
      type={type}
      className={buttonClass}
      onClick={handleClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      {...props}
    >
      {/* Ripple effects */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="btn-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
          }}
        />
      ))}

      {/* Content */}
      <span className="btn-content">
        {loading && (
          <motion.div
            className="btn-spinner"
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 size={size === "sm" ? 14 : size === "lg" ? 20 : 16} />
          </motion.div>
        )}

        {!loading && Icon && iconPosition === "left" && (
          <motion.span
            className="btn-icon"
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Icon size={size === "sm" ? 14 : size === "lg" ? 20 : 16} />
          </motion.span>
        )}

        <span className="btn-text">{loading ? "Loading..." : children}</span>

        {!loading && Icon && iconPosition === "right" && (
          <motion.span
            className="btn-icon"
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Icon size={size === "sm" ? 14 : size === "lg" ? 20 : 16} />
          </motion.span>
        )}
      </span>
    </motion.button>
  );
}
