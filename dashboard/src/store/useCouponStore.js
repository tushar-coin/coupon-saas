import { create } from 'zustand';
import { API_DASHBOARD } from '../config/api';

const useCouponStore = create((set, get) => ({
  coupons: [],
  isLoading: false,
  error: null,

  // Fetch all coupons from backend
  initialize: async () => {
    if (get().isLoading) return; // Prevent duplicate calls
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_DASHBOARD}/coupons`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 401) {
          // Token expired or invalid
          throw new Error("Unauthorized");
      }
      if (!response.ok) throw new Error('Failed to fetch coupons');
      
      const data = await response.json();
      
      // Map Backend -> Frontend
      const mappedCoupons = (data || []).map(c => ({
        id: c.id,
        code: c.code,
        description: c.description,
        type: c.type === 'percentage' ? 'Percentage' : 'Fixed', // Normalize case
        value: c.discount_amount,
        maxDiscount: c.max_discount, // NEW: Max discount cap
        level: c.level, // NEW: cart_level or tag_level
        applicableTags: c.applicable_tags || [], // NEW: Tags for targeting
        minOrder: c.min_order_amount,
        visible: c.visible,
        status: c.is_active ? 'Active' : 'Paused', // Map Bool -> String
        redemptions: c.usage_count,
        usageLimit: c.usage_limit,
        createdAt: c.created_at,
        expiryDate: c.expiry_date // Ensure backend sends this if needed, or ignore
      }));

      set({ coupons: mappedCoupons, isLoading: false });
    } catch (err) {
      console.error(err);
      set({ error: err.message, isLoading: false });
    }
  },

  addCoupon: async (formData) => {
    set({ isLoading: true });
    try {
      // Map Frontend -> Backend
      const payload = {
        code: formData.code,
        description: formData.description,
        type: formData.type.toLowerCase(), // "Percentage" -> "percentage"
        discount_amount: Number(formData.value),
        max_discount: Number(formData.maxDiscount || 0), // NEW: Max discount cap
        level: formData.level || "cart_level", // NEW: Use form data
        applicable_tags: formData.applicableTags || [], // NEW: Use form data
        min_order_amount: Number(formData.minOrder || 0),
        visible: formData.visible,
        is_active: true, // Default active on create
        usage_limit: Number(formData.usageLimit || 0),
        expiry_date: formData.expiryDate ? new Date(formData.expiryDate) : null,
      };

      const token = localStorage.getItem('auth_token');
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      };

      const response = await fetch(`${API_DASHBOARD}/coupons`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create coupon');
      }
      
      // No need to initialize here, Coupons page checks on mount
      
    } catch (err) {
      console.error(err);
      throw err; // Re-throw for UI to handle (toast)
    } finally {
      set({ isLoading: false });
    }
  },

  updateCoupon: async (id, formData) => {
    set({ isLoading: true });
    try {
      const currentCoupon = get().coupons.find(c => c.id === id);
      if (!currentCoupon) throw new Error("Coupon not found for update");

      // Map Frontend -> Backend
      const payload = {
        id: id,
        code: formData.code,
        description: formData.description,
        type: formData.type.toLowerCase(),
        discount_amount: Number(formData.value),
        max_discount: Number(formData.maxDiscount || 0),
        level: formData.level || "cart_level",
        applicable_tags: formData.applicableTags || [],
        min_order_amount: Number(formData.minOrder || 0),
        visible: formData.visible,
        is_active: currentCoupon.status === 'Active', // Preserve existing status
        usage_limit: Number(formData.usageLimit || 0),
        expiry_date: formData.expiryDate ? new Date(formData.expiryDate) : null,
      };

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_DASHBOARD}/coupons/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update coupon');
      }

      // No need to initialize here
      
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteCoupon: async (id) => {
    // 1. Optimistic Update
    const previousCoupons = get().coupons;
    set((state) => ({
      coupons: state.coupons.filter((c) => c.id !== id),
    }));

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_DASHBOARD}/coupons/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete coupon');
      }
    } catch (err) {
      console.error(err);
      // Revert if failed
      set({ coupons: previousCoupons, error: "Failed to delete coupon" });
    }
  },

  toggleStatus: async (id) => {
      const coupon = get().coupons.find(c => c.id === id);
      if (!coupon) return;

      const newStatus = coupon.status === 'Active' ? 'Paused' : 'Active';
      const isActive = newStatus === 'Active';

      // 1. Optimistic Update
      set((state) => ({
          coupons: state.coupons.map(c => c.id === id ? { ...c, status: newStatus } : c)
      }));

      try {
          const token = localStorage.getItem('auth_token');
          // Construct payload based on current coupon data
          const payload = {
            id: coupon.id,
            code: coupon.code,
            description: coupon.description,
            type: coupon.type.toLowerCase(),
            discount_amount: Number(coupon.value),
            max_discount: Number(coupon.maxDiscount || 0),
            level: coupon.level || "cart_level",
            applicable_tags: coupon.applicableTags || [],
            min_order_amount: Number(coupon.minOrder || 0),
            visible: coupon.visible,
            is_active: isActive, // The key change
            usage_limit: Number(coupon.usageLimit || 0),
            expiry_date: coupon.expiryDate,
            // Ensure organization is handled if needed by backend check, 
            // but usually UpdateCoupon relies on ID and auth token org context
          };

          const response = await fetch(`${API_DASHBOARD}/coupons/${id}`, {
              method: 'PUT',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify(payload)
          });

          if (!response.ok) {
             const errText = await response.text();
             throw new Error(errText || "Failed to update status");
          }
          
      } catch (err) {
          console.error("Toggle status failed:", err);
          // Revert on failure
          set((state) => ({
              coupons: state.coupons.map(c => c.id === id ? { ...c, status: coupon.status } : c)
          }));
          set({ error: "Failed to update status. Please try again." });
      }
  },

  getCouponById: (id) => {
    return get().coupons.find((c) => c.id.toString() === id.toString());
  },
}));

export default useCouponStore;
