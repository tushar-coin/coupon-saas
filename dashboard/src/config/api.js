// Centralized API configuration
// Uses Vite environment variable or falls back to localhost for development

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8081';

export const API_URL = `${API_BASE}/api/v1`;
export const API_AUTH = `${API_BASE}/api/v1/auth`;
export const API_TEAM = `${API_BASE}/api/v1/team`;
export const API_DASHBOARD = `${API_BASE}/api/v1/dashboard`;

export default API_BASE;
