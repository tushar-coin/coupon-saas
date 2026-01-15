import { create } from 'zustand';

const API_URL = 'http://localhost:8081/api/v1/dashboard';

const useCouponStore = create((set, get) => ({
  coupons: [],
  isLoading: false,
  error: null,

  // Fetch all coupons from backend
  initialize: async () => {
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
        min_order_amount: Number(formData.minOrder || 0),
        visible: formData.visible,
        is_active: true, // Default active on create
        usage_limit: Number(formData.usageLimit || 0),
        expiry_date: formData.expiryDate ? new Date(formData.expiryDate) : null,
        level: "cart_level", // Default to cart level for simple UI
        applicable_tags: []
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

  updateCoupon: (id, updates) => {
    console.warn("Update not implemented in backend yet");
    // Optimistic update for UI demo
    set((state) => ({
      coupons: state.coupons.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  },

  deleteCoupon: (id) => {
    console.warn("Delete not implemented in backend yet");
    // Optimistic delete
    set((state) => ({
      coupons: state.coupons.filter((c) => c.id !== id),
    }));
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
