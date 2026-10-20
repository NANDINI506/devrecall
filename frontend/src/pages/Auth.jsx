import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bot, ClipboardCheck, Eye, EyeOff, Flame, Layers } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { errMsg } from "../api";
import { Spinner } from "../components/ui";
import { validateSignupForm } from "../utils/helpers";

const FEATURES = [
  { icon: Layers, title: "Topic-wise revision", text: "JavaScript, Python, DBMS, OS, DSA — or any subject you type." },
  { icon: Bot, title: "AI tutor for doubts", text: "Ask in English or Hinglish and get a simple explanation instantly." },
  { icon: ClipboardCheck, title: "Auto-generated quizzes", text: "Test yourself after every topic and see exactly what you missed." },
  { icon: Flame, title: "Daily streaks", text: "Track your progress and build a regular study habit." },
];

export default function Auth({ mode }) {
  const isSignup = mode === "signup";
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const set = (k) => (e) => {
    const next = { ...form, [k]: e.target.value };
    setForm(next);
    if (isSignup && touched[k]) setErrors(validateSignupForm(next));
  };
  const blur = (k) => () => {
    setTouched((t) => ({ ...t, [k]: true }));
    if (isSignup) setErrors(validateSignupForm(form));
  };

  const submit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (isSignup) {
      const v = validateSignupForm(form);
      setErrors(v);
      setTouched({ name: true, email: true, password: true });
      if (Object.keys(v).length) return;
    } else if (!form.email || !form.password) {
      return setServerError("Enter your email and password");
    }
    setBusy(true);
    try {
      if (isSignup) await signup(form);
      else await login(form.email, form.password);
      navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      setErrors(err?.response?.data?.errors || {});
      setServerError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const fieldError = (k) => touched[k] && errors[k];

  return (
    <div className="auth-page">
      <section className="auth-brand">
        <div className="brand brand-lg">▸ Dev<b>Recall</b></div>
        <h2>Revise smarter.<br />Remember longer.</h2>
        <p className="muted">An AI-powered revision platform for developers and computer science students.</p>
        <ul className="feature-list">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <span className="f-icon"><Icon size={18} /></span>
              <div><strong>{title}</strong><span>{text}</span></div>
            </li>
          ))}
        </ul>
      </section>

      <section className="auth-form-wrap">
        <form className="auth-card" onSubmit={submit} noValidate>
          <div className="brand brand-mobile-auth">▸ Dev<b>Recall</b></div>
          <h1>{isSignup ? "Create your account" : "Welcome back"}</h1>
          <p className="muted">{isSignup ? "Start revising in under a minute." : "Log in to continue your revision."}</p>

          {serverError && <div className="alert alert-error" role="alert">{serverError}</div>}

          {isSignup && (
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input id="name" value={form.name} onChange={set("name")} onBlur={blur("name")} autoComplete="name"
                placeholder="e.g. Nandini Sharma" aria-invalid={!!fieldError("name")} />
              {fieldError("name") && <small className="field-error">{errors.name}</small>}
            </div>
          )}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={form.email} onChange={set("email")} onBlur={blur("email")} autoComplete="email"
              placeholder="you@example.com" aria-invalid={!!fieldError("email")} />
            {fieldError("email") && <small className="field-error">{errors.email}</small>}
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="pw-wrap">
              <input id="password" type={showPw ? "text" : "password"} value={form.password} onChange={set("password")} onBlur={blur("password")}
                autoComplete={isSignup ? "new-password" : "current-password"} placeholder={isSignup ? "At least 8 characters, letters + numbers" : "Your password"}
                aria-invalid={!!fieldError("password")} />
              <button type="button" className="pw-toggle" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? "Hide password" : "Show password"}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldError("password") && <small className="field-error">{errors.password}</small>}
          </div>

          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? <><Spinner /> Please wait…</> : isSignup ? "Create account" : "Log in"}
          </button>

          <p className="switch muted">
            {isSignup ? "Already have an account? " : "New to DevRecall? "}
            <Link to={isSignup ? "/login" : "/signup"}>{isSignup ? "Log in" : "Create an account"}</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
