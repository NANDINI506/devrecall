import { useEffect, useState } from "react";

export const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
export const firstName = (name = "") => name.split(" ")[0];

// Dark / light theme, remembered in localStorage
export function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || "dark");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("dr_theme", theme);
  }, [theme]);
  return [theme, () => setTheme((t) => (t === "dark" ? "light" : "dark"))];
}

// Same rules as the server, so users get instant feedback while typing
export function validateSignupForm({ name, email, password }) {
  const errors = {};
  const n = name.trim().replace(/\s+/g, " ");
  if (!n) errors.name = "Full name is required";
  else if (n.length < 2 || n.length > 80) errors.name = "Name must be 2 to 80 characters";
  else if (!/^[A-Za-z]+(?:[ .'-][A-Za-z]+)*$/.test(n)) errors.name = "Name can contain letters only";

  if (!email.trim()) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) errors.email = "Enter a valid email address";

  if (!password) errors.password = "Password is required";
  else if (password.length < 8) errors.password = "Use at least 8 characters";
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) errors.password = "Add at least one letter and one number";
  return errors;
}
