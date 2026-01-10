import { create } from 'zustand';
import initialData from '../data/coupons.json';

const useCouponStore = create((set, get) => ({
  coupons: [],

  // Initialize store: check localStorage first, else use initialData
  initialize: () => {
    const localData = localStorage.getItem('coupon_data');
    if (localData) {
      set({ coupons: JSON.parse(localData) });
    } else {
      set({ coupons: initialData });
      localStorage.setItem('coupon_data', JSON.stringify(initialData));
    }
  },

  addCoupon: (newCoupon) => {
    set((state) => {
      const updatedCoupons = [
        ...state.coupons,
        {
          id: crypto.randomUUID(), // Generate unique ID
          redemptions: 0, // Default for new coupon
          createdAt: new Date().toISOString().split('T')[0],
          status: 'Active',
          ...newCoupon,
        },
      ];
      localStorage.setItem('coupon_data', JSON.stringify(updatedCoupons));
      return { coupons: updatedCoupons };
    });
  },

  updateCoupon: (id, updates) => {
    set((state) => {
      const updatedCoupons = state.coupons.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      );
      localStorage.setItem('coupon_data', JSON.stringify(updatedCoupons));
      return { coupons: updatedCoupons };
    });
  },

  deleteCoupon: (id) => {
    set((state) => {
      const updatedCoupons = state.coupons.filter((c) => c.id !== id);
      localStorage.setItem('coupon_data', JSON.stringify(updatedCoupons));
      return { coupons: updatedCoupons };
    });
  },

  toggleStatus: (id) => {
    set((state) => {
      const updatedCoupons = state.coupons.map((c) => {
        if (c.id === id) {
          const newStatus = c.status === 'Active' ? 'Paused' : 'Active';
          return { ...c, status: newStatus };
        }
        return c;
      });
      localStorage.setItem('coupon_data', JSON.stringify(updatedCoupons));
      return { coupons: updatedCoupons };
    });
  },

  getCouponById: (id) => {
    return get().coupons.find((c) => c.id.toString() === id.toString());
  },
}));

export default useCouponStore;
