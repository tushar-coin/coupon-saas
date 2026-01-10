import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./FloatingLabelInput.css";

export default function FloatingLabelInput({
  label,
  type = "text",
  name,
  value,
  onChange,
  error,
  icon: Icon,
  required = false,
  className = "",
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value && value.toString().length > 0;
  const isFloating = isFocused || hasValue;

  return (
    <div className={`floating-input-wrapper ${className}`}>
      <div className={`floating-input-container ${isFocused ? 'focused' : ''} ${error ? 'error' : ''}`}>
        {Icon && (
          <motion.div
            className="input-icon"
            animate={{ scale: isFocused ? 1.1 : 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Icon size={18} />
          </motion.div>
        )}

        <div className="input-field-wrapper">
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="floating-input"
            placeholder=" " // Required for CSS :placeholder-shown
            {...props}
          />
          
          <motion.label
            className="floating-label"
            animate={{
              y: isFloating ? -24 : 0,
              scale: isFloating ? 0.85 : 1,
              color: isFocused 
                ? "var(--primary)" 
                : error 
                  ? "var(--danger)" 
                  : "var(--text-muted)"
            }}
            transition={{ duration: 0.2 }}
          >
            {label}
            {required && <span className="required-indicator"> *</span>}
          </motion.label>
        </div>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="input-error"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
