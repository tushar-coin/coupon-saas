import { create } from 'zustand';

// Toast notification store
const useToastStore = create((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = Date.now();
    const newToast = { id, duration: 4000, ...toast };
    
    set((state) => ({ toasts: [...state.toasts, newToast] }));
    
    // Auto-remove after duration
    setTimeout(() => {
      get().removeToast(id);
    }, newToast.duration);
    
    return id;
  },

  removeToast: (id) => {
    set((state) => ({ 
      toasts: state.toasts.filter((t) => t.id !== id) 
    }));
  },

  // Convenience methods
  success: (message) => get().addToast({ type: 'success', message }),
  error: (message) => get().addToast({ type: 'error', message }),
  info: (message) => get().addToast({ type: 'info', message }),
  warning: (message) => get().addToast({ type: 'warning', message }),
}));

export default useToastStore;
