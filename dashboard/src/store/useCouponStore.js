import { create } from 'zustand';

const API_URL = 'http://localhost:8081/api/v1/dashboard';

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
      const response = await fetch(`${API_URL}/coupons`, {
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

      const response = await fetch(`${API_URL}/coupons`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create coupon');
      }
      
      // Refresh list after add
      get().initialize();
      
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
      const response = await fetch(`${API_URL}/coupons/${id}`, {
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

      // Refresh list
      get().initialize();
      
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
      const response = await fetch(`${API_URL}/coupons/${id}`, {
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

  toggleStatus: (id) => {
      // TODO: Call API to toggle is_active
      console.warn("Toggle Status not synced with backend");
      set((state) => {
      const updatedCoupons = state.coupons.map((c) => {
        if (c.id === id) {
          const newStatus = c.status === 'Active' ? 'Paused' : 'Active';
          return { ...c, status: newStatus };
        }
        return c;
      });
      return { coupons: updatedCoupons };
    });
  },

  getCouponById: (id) => {
    return get().coupons.find((c) => c.id.toString() === id.toString());
  },
}));

export default useCouponStore;
