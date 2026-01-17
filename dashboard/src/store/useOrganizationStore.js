import { create } from 'zustand';

const API_URL = 'http://localhost:8081/api/v1';

const useOrganizationStore = create((set, get) => ({
  organization: null,
  tags: [],
  isLoading: false,
  error: null,

  // Fetch organization details including tags
  fetchOrganization: async () => {
    if (get().isLoading) return; // Prevent duplicate calls
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/organization`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        throw new Error("Unauthorized");
      }
      if (!response.ok) throw new Error('Failed to fetch organization');

      const data = await response.json();
      set({ 
        organization: data, 
        tags: data.tags || [],
        isLoading: false 
      });
    } catch (err) {
      console.error(err);
      set({ error: err.message, isLoading: false });
    }
  },

  // Add a new tag
  addTag: async (tag) => {
    const currentTags = get().tags;
    const trimmedTag = tag.trim().toLowerCase();
    
    // Validation
    if (!trimmedTag) return { success: false, error: "Tag cannot be empty" };
    if (currentTags.some(t => t.toLowerCase() === trimmedTag)) {
      return { success: false, error: "Tag already exists" };
    }

    const newTags = [...currentTags, trimmedTag];
    return get().updateTags(newTags);
  },

  // Remove a tag
  removeTag: async (tagToRemove) => {
    const currentTags = get().tags;
    const newTags = currentTags.filter(t => t !== tagToRemove);
    return get().updateTags(newTags);
  },

  // Update all tags (internal)
  updateTags: async (newTags) => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/organization/tags`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ tags: newTags })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update tags');
      }

      const data = await response.json();
      set({ tags: data.tags || newTags, isLoading: false });
      return { success: true };
    } catch (err) {
      console.error(err);
      set({ isLoading: false });
      return { success: false, error: err.message };
    }
  },

  // Get tags for coupon creation
  getTags: () => get().tags,
}));

export default useOrganizationStore;
