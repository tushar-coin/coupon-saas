import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";
import useToastStore from "../store/useToastStore";
import "./Toast.css";

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type] || Info;
          return (
            <motion.div
              key={toast.id}
              className={`toast toast-${toast.type}`}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div className="toast-icon">
                <Icon size={20} />
              </div>
              <span className="toast-message">{toast.message}</span>
              <button 
                className="toast-close" 
                onClick={() => removeToast(toast.id)}
              >
                <X size={16} />
              </button>
              
              {/* Progress bar */}
              <motion.div
                className="toast-progress"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: toast.duration / 1000, ease: "linear" }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
