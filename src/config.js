// Toggle this to false to use real API endpoints instead of the mock
export const useMock = true

// Secret key to send to the backend. In production this should come from a secure store.
// In Vite the client-side env vars start with VITE_ and are available on import.meta.env
export const SECRET_KEY = import.meta.env.VITE_SECRET_KEY || 'test-secret-key'
