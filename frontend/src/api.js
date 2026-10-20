import axios from "axios";

// One shared axios instance. It adds the login token to every request automatically.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("dr_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Turns any error into a friendly message for the UI.
export const errMsg = (e, fallback = "Something went wrong. Please try again.") =>
  e?.response?.data?.message || (e?.code === "ERR_NETWORK" ? "Cannot reach the server. Is the backend running?" : fallback);

export default api;
