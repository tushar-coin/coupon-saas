import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Check, ChevronRight, Tag, DollarSign, Percent, FileText, Calendar, ShoppingCart, Layers } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { z } from "zod"; // Zod for validation

import ProgressBar from "../components/ui/ProgressBar";
import FloatingLabelInput from "../components/ui/FloatingLabelInput";
import Button from "../components/ui/Button";
import Select from "../components/ui/Select";
import DateTimePicker from "../components/ui/DateTimePicker";
import Toast from "../components/ui/Toast"; // Toast notification
import TagSelector from "../components/ui/TagSelector"; // NEW: Tag selector

import useCouponStore from "../store/useCouponStore";
import useOrganizationStore from "../store/useOrganizationStore"; // NEW: Organization store

import "../styles/CreateCoupon.css";

const STEPS = [
  { id: 1, title: "Offer Details" },
  { id: 2, title: "Rules & Limits" },
  { id: 3, title: "Visibility" },
];

// Validation Schemas
const step1Schema = z.object({
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .regex(/^[a-zA-Z0-9]+$/, "Code can only contain letters and numbers (no spaces)"),
  type: z.enum(["Percentage", "Fixed"]),
  value: z.coerce
    .number({ invalid_type_error: "Value must be a number" })
    .positive("Discount value must be greater than 0"),
  maxDiscount: z.coerce
    .number({ invalid_type_error: "Maximum discount must be a number" })
    .positive("Maximum discount must be greater than 0")
    .optional()
    .or(z.literal("")),
  description: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.type === "Percentage" && data.value > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Percentage discount cannot exceed 100%",
      path: ["value"],
    });
  }
  // maxDiscount is required when type is Percentage
  if (data.type === "Percentage" && (!data.maxDiscount || data.maxDiscount === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Maximum discount cap is required for percentage discounts",
      path: ["maxDiscount"],
    });
  }
});

const step2Schema = z.object({
  minOrder: z.coerce
    .number({ invalid_type_error: "Minimum order must be a number" })
    .positive("Minimum order amount is required and must be greater than 0"),
  usageLimit: z.coerce
    .number({ invalid_type_error: "Usage limit must be a number" })
    .int("Usage limit must be a whole number")
    .positive("Usage limit is required and must be greater than 0"),
  expiryDate: z.string().min(1, "Expiry date is required").refine((val) => {
    return new Date(val) > new Date();
  }, "Expiry date must be in the future")
});

export default function CreateCoupon() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  
  const { coupons, addCoupon, updateCoupon, getCouponById, initialize } = useCouponStore();
  const { tags: organizationTags, fetchOrganization } = useOrganizationStore();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ 
    code: "", 
    description: "", 
    type: "Percentage", 
    value: "", 
    maxDiscount: "",      
    level: "cart_level",  
    applicableTags: [],   
    minOrder: "", 
    usageLimit: "", 
    expiryDate: "", 
    visible: true 
  });
  
  const [errors, setErrors] = useState({});
  const toastRef = useRef(null);

  // Refs for focusing inputs on error
  const inputRefs = {
    code: useRef(null),
    value: useRef(null),
    minOrder: useRef(null),
    usageLimit: useRef(null),
  };

  const focusFirstError = (currentErrors) => {
    const firstField = Object.keys(currentErrors)[0];
    if (inputRefs[firstField]?.current) {
        inputRefs[firstField].current.focus();
        inputRefs[firstField].current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Initialize store if landing directly here
  useEffect(() => {
    initialize();
    fetchOrganization(); 
  }, [initialize, fetchOrganization]);

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
          maxDiscount: existingCoupon.maxDiscount || "", 
          level: existingCoupon.level || "cart_level",  
          applicableTags: existingCoupon.applicableTags || [], 
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
    const newValue = type === "checkbox" ? checked : value;
    
    setFormData((prev) => {
      const updatedData = {
        ...prev,
        [name]: newValue,
      };
      
      // Re-validate value field when discount type changes and value exists
      if (name === "type" && prev.value) {
        const result = step1Schema.safeParse(updatedData);
        if (!result.success) {
          const issues = result.error.errors || result.error.issues || [];
          const valueError = issues.find(err => err.path[0] === "value");
          if (valueError) {
            setErrors(prevErrors => ({ ...prevErrors, value: valueError.message }));
          } else {
            // Clear value error if validation passes
            setErrors(prevErrors => {
              const newErrors = { ...prevErrors };
              delete newErrors.value;
              return newErrors;
            });
          }
        } else {
          // Clear value error if validation passes
          setErrors(prevErrors => {
            const newErrors = { ...prevErrors };
            delete newErrors.value;
            return newErrors;
          });
        }
      }
      
      return updatedData;
    });
    
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
    
    let result;
    if (step === 1) {
       result = step1Schema.safeParse(formData);
    } else if (step === 2) {
       result = step2Schema.safeParse(formData);
    }

    if (result && !result.success) {
       const issues = result.error.errors || result.error.issues || [];
       const fieldError = issues.find(err => err.path[0] === name);
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
          maxDiscount: formData.maxDiscount,
          description: formData.description
        });

        // Uniqueness Check
        if (!isEditMode) {
          const codeExists = coupons.find(c => c.code.toLowerCase() === formData.code.toLowerCase());
          if (codeExists) {
            const errorMsg = "This code already exists in your organization.";
            setErrors(prev => ({ ...prev, code: errorMsg }));
            toastRef.current.addToast(errorMsg, "error");
            focusFirstError({ code: errorMsg });
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
        const issues = error.errors || error.issues || [];
        
        issues.forEach(err => {
          if (err.path[0]) fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
        focusFirstError(fieldErrors);
        
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
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double submit
  
  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (step !== 3) return;
    if (isSubmitting) return; // Prevent double submit
    
    setIsSubmitting(true);
    console.log("Starting submission...");
    
    try {
      if (isEditMode) {
        await updateCoupon(id, formData);
        console.log("Coupon updated successfully");
        toastRef.current?.addToast("Coupon updated successfully!", "success");
      } else {
        await addCoupon(formData);
        console.log("Coupon created successfully");
        toastRef.current?.addToast("Coupon created successfully!", "success");
        
        // Removed confetti to isolate navigation issue
      }

      console.log("Navigating to /coupons...");
      navigate("/coupons");
    } catch (error) {
      console.error("Submission error:", error);
      toastRef.current?.addToast(error.message || "Failed to create coupon", "error");
      setIsSubmitting(false); // Re-enable on error
    }
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
                ref={inputRefs.code}
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
                    ref={inputRefs.value}
                    label={formData.type === "Percentage" ? "Percentage Value" : "Discount Value"}
                    name="value"
                    type="number"
                    value={formData.value}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    icon={formData.type === "Percentage" ? Percent : DollarSign}
                    required
                    error={errors.value}
                  />
                </div>
              </div>

              {/* Maximum Discount Cap - Required for Percentage */}
              {formData.type === "Percentage" && (
                <div className="form-group">
                  <FloatingLabelInput
                    label="Maximum Discount Cap ($)"
                    name="maxDiscount"
                    type="number"
                    value={formData.maxDiscount}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    icon={DollarSign}
                    required
                    error={errors.maxDiscount}
                  />
                  <span className="helper-text">
                    Caps the maximum discount (e.g., 20% off, up to $50)
                  </span>
                </div>
              )}

              {/* NEW: Coupon Level Toggle - Now in a section box */}
              <div className="section-box">
                <label className="section-label">Coupon Scope</label>
                <p className="section-description">Choose if this coupon applies to the entire cart or specific product categories.</p>
                <div className="level-toggle">
                  <label className={`level-option ${formData.level === "cart_level" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="level"
                      value="cart_level"
                      checked={formData.level === "cart_level"}
                      onChange={handleChange}
                    />
                    <ShoppingCart size={24} />
                    <span>Entire Cart</span>
                  </label>
                  <label className={`level-option ${formData.level === "tag_level" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="level"
                      value="tag_level"
                      checked={formData.level === "tag_level"}
                      onChange={handleChange}
                    />
                    <Layers size={24} />
                    <span>Specific Categories</span>
                  </label>
                </div>

                {/* Tag Selector - Inside the section box */}
                {formData.level === "tag_level" && (
                  <div className="tag-selector-wrapper">
                    <label className="subsection-label">Select Categories</label>
                    <TagSelector
                      availableTags={organizationTags}
                      selectedTags={formData.applicableTags}
                      onChange={(tags) => setFormData(prev => ({...prev, applicableTags: tags}))}
                      placeholder="Choose product categories..."
                      emptyMessage="No categories defined. Add them in Settings → Product Categories."
                    />
                    <span className="helper-text">
                      Coupon will only apply to items in these categories.
                    </span>
                  </div>
                )}
              </div>

              {/* Description - At the end */}
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
                ref={inputRefs.minOrder}
                label="Minimum Order Amount ($)"
                name="minOrder"
                type="number"
                value={formData.minOrder}
                onChange={handleChange}
                onBlur={handleBlur}
                icon={DollarSign}
                required
                error={errors.minOrder}
              />

              <div className="form-row">
                <div className="form-group">
                  <FloatingLabelInput
                    ref={inputRefs.usageLimit}
                    label="Usage Limit (Total)"
                    name="usageLimit"
                    type="number"
                    value={formData.usageLimit}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
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
                    <label className="floating-mimic-label with-icon">Expiry Date & Time <span className="required-indicator"> *</span></label>
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
                loading={isSubmitting}
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
