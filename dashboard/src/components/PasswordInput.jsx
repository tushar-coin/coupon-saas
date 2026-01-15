import { useState, useMemo } from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";
import "./PasswordInput.css";

/**
 * PasswordInput - Enhanced password field with:
 * - Show/hide toggle
 * - Password strength meter
 * - Real-time requirement checklist
 */
export default function PasswordInput({ 
  value, 
  onChange, 
  placeholder = "Enter password",
  showStrength = false,
  minLength = 8 
}) {
  const [showPassword, setShowPassword] = useState(false);

  // Password strength calculation
  const strength = useMemo(() => {
    if (!value) return { score: 0, label: "", color: "" };
    
    let score = 0;
    const checks = {
      length: value.length >= minLength,
      uppercase: /[A-Z]/.test(value),
      lowercase: /[a-z]/.test(value),
      number: /[0-9]/.test(value),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(value),
    };

    if (checks.length) score++;
    if (checks.uppercase) score++;
    if (checks.lowercase) score++;
    if (checks.number) score++;
    if (checks.special) score++;

    const labels = ["", "Weak", "Fair", "Good", "Strong", "Excellent"];
    const colors = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];

    return { 
      score, 
      label: labels[score], 
      color: colors[score],
      checks 
    };
  }, [value, minLength]);

  return (
    <div className="password-input-wrapper">
      <div className="password-input-container">
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="input password-input"
          minLength={minLength}
          required
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setShowPassword(!showPassword)}
          tabIndex={-1}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {showStrength && value && (
        <>
          {/* Strength Bar */}
          <div className="strength-bar-container">
            <div 
              className="strength-bar" 
              style={{ 
                width: `${(strength.score / 5) * 100}%`,
                backgroundColor: strength.color 
              }} 
            />
          </div>
          <span className="strength-label" style={{ color: strength.color }}>
            {strength.label}
          </span>

          {/* Requirements Checklist */}
          <ul className="password-requirements">
            <RequirementItem met={strength.checks?.length} text={`At least ${minLength} characters`} />
            <RequirementItem met={strength.checks?.uppercase} text="One uppercase letter" />
            <RequirementItem met={strength.checks?.lowercase} text="One lowercase letter" />
            <RequirementItem met={strength.checks?.number} text="One number" />
            <RequirementItem met={strength.checks?.special} text="One special character" />
          </ul>
        </>
      )}
    </div>
  );
}

function RequirementItem({ met, text }) {
  return (
    <li className={`requirement-item ${met ? "met" : ""}`}>
      {met ? <Check size={14} /> : <X size={14} />}
      <span>{text}</span>
    </li>
  );
}
