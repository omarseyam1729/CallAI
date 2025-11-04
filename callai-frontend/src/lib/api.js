export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";
export const api = (path) => `${API_BASE}${path}`;
