import { create } from 'zustand';

const API_URL = 'http://localhost:8081/api/v1';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user_data')) || null,
  token: localStorage.getItem('auth_token') || null,
  isAuthenticated: !!localStorage.getItem('auth_token'),
  isLoading: false,
  error: null,

  login: async (email, password, orgName) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, org_name: orgName }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Login failed');
      }

      const data = await response.json();
      
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_data', JSON.stringify(data.user));

      set({ 
        user: data.user, 
        token: data.token, 
        isAuthenticated: true, 
        isLoading: false 
      });
      
      return true;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  register: async (email, password, orgName) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, org_name: orgName }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Registration failed');
      }

      set({ isLoading: false });
      return true; 
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  uploadLogo: async (file) => {
      set({ isLoading: true, error: null });
      try {
          const formData = new FormData();
          formData.append('logo', file);
          
          const token = localStorage.getItem('auth_token');
          const response = await fetch(`${API_URL}/auth/upload-logo`, {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${token}`
              },
              body: formData
          });

          if (!response.ok) throw new Error("Upload failed");
          
          const data = await response.json();
          
          const updatedUser = { ...get().user, logo_url: data.logo_url };
          set({ user: updatedUser, isLoading: false });
          localStorage.setItem('user_data', JSON.stringify(updatedUser));
          
          return data.logo_url;
      } catch (err) {
          set({ error: err.message, isLoading: false });
          return null;
      }
  },

  // Check if user can invite/manage team
  canInvite: () => {
    const user = get().user;
    return user?.role === 'owner' || user?.role === 'admin';
  },

  canManageRoles: () => {
    const user = get().user;
    return user?.role === 'owner';
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    set({ user: null, token: null, isAuthenticated: false });
  }
}));

export default useAuthStore;
