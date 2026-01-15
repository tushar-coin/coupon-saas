import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import "./CustomSelect.css";

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div 
      ref={containerRef} 
      className={`custom-select ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
    >
      <button
        type="button"
        className="select-trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className={selectedOption ? '' : 'placeholder'}>
          {selectedOption?.label || placeholder}
        </span>
        <motion.span
          className="select-arrow"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={18} />
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="select-dropdown"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            {options.map((option) => (
              <motion.button
                key={option.value}
                type="button"
                className={`select-option ${option.value === value ? 'selected' : ''}`}
                onClick={() => handleSelect(option)}
                whileHover={{ backgroundColor: "var(--select-hover)" }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="option-label">{option.label}</span>
                {option.description && (
                  <span className="option-description">{option.description}</span>
                )}
                {option.value === value && (
                  <Check size={16} className="option-check" />
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
