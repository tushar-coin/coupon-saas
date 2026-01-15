import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import "./ConfirmModal.css";

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger" // danger, warning, info
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="confirm-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="confirm-modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="confirm-close" onClick={onClose}>
            <X size={18} />
          </button>

          <div className={`confirm-icon confirm-icon-${variant}`}>
            <AlertTriangle size={28} />
          </div>

          <h3 className="confirm-title">{title}</h3>
          <p className="confirm-message">{message}</p>

          <div className="confirm-actions">
            <button className="btn-cancel" onClick={onClose}>
              {cancelText}
            </button>
            <button 
              className={`btn-confirm btn-confirm-${variant}`}
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
