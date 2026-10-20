import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "../api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => !!localStorage.getItem("dr_token"));

  const logout = useCallback(() => {
    localStorage.removeItem("dr_token");
    setUser(null);
  }, []);

  // Re-read the user (used to refresh the streak after studying)
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
    } catch { /* ignore */ }
  }, []);

  // On page load: if a token exists, find out who the user is
  useEffect(() => {
    if (!localStorage.getItem("dr_token")) return;
    api.get("/auth/me").then(({ data }) => setUser(data.user)).catch(logout).finally(() => setLoading(false));
  }, [logout]);

  // If the server ever says "401" (token expired), log out automatically
  useEffect(() => {
    const id = api.interceptors.response.use(
      (r) => r,
      (err) => {
        if (err.response?.status === 401 && !String(err.config?.url).startsWith("/auth/")) logout();
        return Promise.reject(err);
      }
    );
    return () => api.interceptors.response.eject(id);
  }, [logout]);

  const authenticate = ({ token, user }) => {
    localStorage.setItem("dr_token", token);
    setUser(user);
  };
  const login = async (email, password) => authenticate((await api.post("/auth/login", { email, password })).data);
  const signup = async (form) => authenticate((await api.post("/auth/signup", form)).data);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>{children}</AuthContext.Provider>
  );
}
