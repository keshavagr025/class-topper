const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
// Clean up any trailing /api or / to get the correct base domain URL
export const API_BASE_URL = rawApiUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
export const API_URL = `${API_BASE_URL}/api`;
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, "ws");

