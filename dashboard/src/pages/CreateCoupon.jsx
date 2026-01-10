import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Check, ChevronRight, Tag, DollarSign, FileText, Calendar } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import confetti from "canvas-confetti";
import { z } from "zod"; // Zod for validation

import ProgressBar from "../components/ui/ProgressBar";
import FloatingLabelInput from "../components/ui/FloatingLabelInput";
import Button from "../components/ui/Button";
import Select from "../components/ui/Select";
import DateTimePicker from "../components/ui/DateTimePicker";
import Toast from "../components/ui/Toast"; // Toast notification

import "../styles/CreateCoupon.css";

const STEPS = [
  { id: 1, title: "Offer Details" },
  { id: 2, title: "Rules & Limits" },
  { id: 3, title: "Visibility" },
];

import useCouponStore from "../store/useCouponStore";

// Validation Schemas
const step1Schema = z.object({
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .regex(/^[a-zA-Z0-9]+$/, "Code can only contain letters and numbers (no special characters like $ or spaces)"),
  type: z.enum(["Percentage", "Fixed"]),
  value: z.coerce
    .number({ invalid_type_error: "Value must be a number" })
    .positive("Discount value must be greater than 0"),
  description: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.type === "Percentage" && data.value > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Percentage discount cannot exceed 100%",
      path: ["value"],
    });
  }
});

const step2Schema = z.object({
  minOrder: z.coerce
    .number()
    .nonnegative("Minimum order cannot be negative") // explicitly checks >= 0
    .optional()
    .or(z.literal("")),
  usageLimit: z.coerce
    .number()
    .int("Usage limit must be a whole number")
    .nonnegative("Usage limit cannot be negative")
    .optional()
    .or(z.literal("")),
  expiryDate: z.string().refine((val) => {
    if (!val) return true; // Optional
    return new Date(val) > new Date();
  }, "Expiry date must be in the future").optional().or(z.literal(""))
});

export default function CreateCoupon() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  
  const { coupons, addCoupon, updateCoupon, getCouponById, initialize } = useCouponStore();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ 
    code: "", 
    description: "", 
    type: "Percentage", 
    value: "", 
    minOrder: "", 
    usageLimit: "", 
    expiryDate: "", 
    visible: true 
  });
  
  const [errors, setErrors] = useState({});
  const toastRef = useRef(null);

  // Initialize store if landing directly here
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Load Data for Edit Mode
  useEffect(() => {
    if (isEditMode) {
      const existingCoupon = getCouponById(id);
      if (existingCoupon) {
        setFormData({
          code: existingCoupon.code,
          description: existingCoupon.description || "",
          type: existingCoupon.type,
          value: existingCoupon.value,
          minOrder: existingCoupon.minOrder || "",
          usageLimit: existingCoupon.usageLimit || "",
          expiryDate: existingCoupon.expiryDate || "",
          visible: existingCoupon.visible,
        });
      }
    }
  }, [isEditMode, id, getCouponById]);

  // Handle Input Change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    
    // Clear error for this field immediately on change to improve UX
    if (errors[name]) {
      setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
      });
    }
  };

  // Real-time Validation on Blur
  const handleBlur = (e) => {
    const { name } = e.target;
    // Don't validate if empty (optional fields) unless required? 
    // Actually, for better UX, we validate against the schema:
    
    let result;
    if (step === 1) {
       result = step1Schema.safeParse(formData);
    } else if (step === 2) {
       result = step2Schema.safeParse(formData);
    }

    if (result && !result.success) {
       const fieldError = result.error.errors.find(err => err.path[0] === name);
       if (fieldError) {
          setErrors(prev => ({ ...prev, [name]: fieldError.message }));
       }
    }
    
    // Uniqueness Check on Blur for Code
    if (name === "code" && !isEditMode && formData.code) {
        const codeExists = coupons.find(c => c.code.toLowerCase() === formData.code.toLowerCase());
        if (codeExists) {
            setErrors(prev => ({ ...prev, code: "This code is already taken." }));
        }
    }
  };

  // Validate Step Logic
  const validateStep = (currentStep) => {
    try {
      if (currentStep === 1) {
        step1Schema.parse({
          code: formData.code,
          type: formData.type,
          value: formData.value,
          description: formData.description
        });

        // Uniqueness Check (Only for New Coupons or if Code Changed)
        if (!isEditMode) {
          const codeExists = coupons.find(c => c.code.toLowerCase() === formData.code.toLowerCase());
          if (codeExists) {
            setErrors(prev => ({ ...prev, code: "Here we go again... This code already exists." }));
            toastRef.current.addToast("Coupon code matches existing coupon", "error");
            return false;
          }
        }
      } else if (currentStep === 2) {
        step2Schema.parse({
            minOrder: formData.minOrder,
            usageLimit: formData.usageLimit,
            expiryDate: formData.expiryDate
        });
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = {};
        error.errors.forEach(err => {
          if (err.path[0]) fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
        
        // Show generic toast or specific if simple
        toastRef.current.addToast("Please fix the errors before proceeding", "error");
      }
      return false;
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, 3));
    }
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  // FINAL SUBMIT
  const handleSubmit = (e) => {
    e?.preventDefault();
    if (step !== 3) return;
    
    // Final check? usually Step 3 is just visibility, safe to assume valid
    
    if (isEditMode) {
      updateCoupon(id, formData);
      toastRef.current.addToast("Coupon updated successfully!", "success");
    } else {
      addCoupon(formData);
      toastRef.current.addToast("Coupon created successfully!", "success");
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B']
      });
    }

    setTimeout(() => navigate("/coupons"), 1500);
  };

  return (
    <div className="create-coupon-container">
      <Toast ref={toastRef} />
      
      {/* Header */}
      <div className="create-header">
        <Link to="/coupons" className="back-link">
          <ArrowLeft size={18} /> Back to Coupons
        </Link>
        <h2 className="page-title">{isEditMode ? "Edit Coupon" : "Create New Coupon"}</h2>
      </div>

      {/* Progress Bar */}
      <ProgressBar progress={step} steps={3} />

      {/* Steps */}
      <div className="steps-container">
        {STEPS.map((s, idx) => (
          <div
            key={s.id}
            className={`step-item ${step >= s.id ? "active" : ""}`}
          >
            <div className="step-number">
              {step > s.id ? <Check size={16} /> : s.id}
            </div>
            <span className="step-title">{s.title}</span>
            {idx < STEPS.length - 1 && <div className="step-line"></div>}
          </div>
        ))}
      </div>

      {/* Form Card */}
      <div className="card form-card">
        {/* ❌ No form submit, no auto submit */}
        <form
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
            }
          }}
        >
          {/* STEP 1 */}
          {step === 1 && (
            <div className="form-step">
              <FloatingLabelInput
                label="Coupon Code"
                name="code"
                type="text"
                value={formData.code}
                onChange={handleChange}
                onBlur={handleBlur}
                icon={Tag}
                required
                error={errors.code}
              />
              <span className="helper-text">
                This is the code customers will enter.
              </span>

              <div className="form-row equal-height-row">
                <div className="form-group">
                  <div className="floating-input-mimic">
                    <Select
                      options={[
                        { value: "Percentage", label: "Percentage (%)" },
                        { value: "Fixed", label: "Fixed Amount ($)" }
                      ]}
                      value={formData.type}
                      onChange={(val) => handleChange({ target: { name: 'type', value: val } })}
                      icon={Tag}
                      className="no-border" 
                    />
                    <label className="floating-mimic-label">Discount Type</label>
                  </div>
                </div>

                <div className="form-group">
                  <FloatingLabelInput
                    label="Discount Value"
                    name="value"
                    type="number"
                    value={formData.value}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    icon={DollarSign}
                    required
                    error={errors.value}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  name="description"
                  className="input"
                  rows="3"
                  placeholder="e.g. Get 20% off on all summer items"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="form-step">
              <FloatingLabelInput
                label="Minimum Order Amount ($)"
                name="minOrder"
                type="number"
                value={formData.minOrder}
                onChange={handleChange}
                onBlur={handleBlur}
                icon={DollarSign}
                error={errors.minOrder}
              />

              <div className="form-row">
                <div className="form-group">
                  <FloatingLabelInput
                    label="Usage Limit (Total)"
                    name="usageLimit"
                    type="number"
                    value={formData.usageLimit}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.usageLimit}
                  />
                </div>

                <div className="form-group">
                  <div className={`floating-input-mimic ${errors.expiryDate ? 'error-border' : ''}`}>
                    <DateTimePicker
                      value={formData.expiryDate}
                      onChange={(val) => {
                            handleChange({ target: { name: 'expiryDate', value: val } })
                      }}
                      className="no-border"
                    />
                    <label className="floating-mimic-label with-icon">Expiry Date & Time</label>
                  </div>
                  {errors.expiryDate && <span className="error-text-sm">{errors.expiryDate}</span>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="form-step">
              <div className="visibility-monitor">
                <label className="radio-card">
                  <input
                    type="radio"
                    name="visible"
                    value="true"
                    checked={formData.visible === true}
                    onChange={() =>
                      setFormData((p) => ({ ...p, visible: true }))
                    }
                  />
                  <div className="radio-content">
                    <span className="radio-title">Public Coupon</span>
                    <p>
                      Visible to everyone in the widget "Explore Offers" list.
                    </p>
                  </div>
                </label>

                <label className="radio-card">
                  <input
                    type="radio"
                    name="visible"
                    value="false"
                    checked={formData.visible === false}
                    onChange={() =>
                      setFormData((p) => ({ ...p, visible: false }))
                    }
                  />
                  <div className="radio-content">
                    <span className="radio-title">
                      Hidden (Influencer/Direct)
                    </span>
                    <p>
                      Not visible in widget. Customers must know the code.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* ACTIONS */}
          <div className="form-actions">
            {step > 1 && (
              <Button
                type="button"
                variant="secondary"
                onClick={prevStep}
              >
                Back
              </Button>
            )}

            {step < 3 ? (
              <Button
                type="button"
                variant="primary"
                icon={ChevronRight}
                iconPosition="right"
                onClick={nextStep}
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                icon={Check}
                onClick={handleSubmit}
              >
                {isEditMode ? "Update Coupon" : "Create Coupon"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
