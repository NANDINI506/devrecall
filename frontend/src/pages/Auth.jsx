import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bot, ClipboardCheck, Eye, EyeOff, Flame, Layers, Mail, ShieldCheck, RotateCcw, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { errMsg } from "../api";
import { Spinner } from "../components/ui";
import { validateSignupForm } from "../utils/helpers";

const FEATURES = [
  { icon: Layers, title: "Topic-wise revision", text: "JavaScript, Python, DBMS, OS, DSA — or any subject you type." },
  { icon: Bot, title: "AI tutor for doubts", text: "Ask any doubt and get a senior-level explanation instantly." },
  { icon: ClipboardCheck, title: "Auto-generated quizzes", text: "Test yourself after every topic and see exactly what you missed." },
  { icon: Flame, title: "Daily streaks", text: "Track your progress and build a regular study habit." },
];

// ─── OTP Input: 6 individual boxes ─────────────────────────────────────────
function OtpInputRow({ otp, setOtp }) {
  const refs = Array.from({ length: 6 }, () => useRef(null));

  const handleChange = (i, val) => {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = otp.split("");
    next[i] = d;
    setOtp(next.join(""));
    if (d && i < 5) refs[i + 1].current?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) refs[i - 1].current?.focus();
    if (e.key === "ArrowLeft" && i > 0) refs[i - 1].current?.focus();
    if (e.key === "ArrowRight" && i < 5) refs[i + 1].current?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted);
      refs[5].current?.focus();
      e.preventDefault();
    }
  };

  return (
    <div className="otp-row" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={refs[i]}
          className="otp-digit-input"
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={otp[i] || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}

// ─── Main Auth Page ──────────────────────────────────────────────────────────
export default function Auth({ mode }) {
  const isSignup = mode === "signup";
  const { login, signup, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ── Stage: "form" | "otp" | "verified"
  const [stage, setStage] = useState("form");
  const [pendingEmail, setPendingEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const set = (k) => (e) => {
    const next = { ...form, [k]: e.target.value };
    setForm(next);
    if (isSignup && touched[k]) setErrors(validateSignupForm(next));
  };
  const blur = (k) => () => {
    setTouched((t) => ({ ...t, [k]: true }));
    if (isSignup) setErrors(validateSignupForm(form));
  };

  // ── Submit signup / login form
  const submit = async (e) => {
    e.preventDefault();
    setServerError("");
    setSuccessMsg("");

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
      if (isSignup) {
        const res = await signup(form);
        if (res.requiresOtp) {
          setPendingEmail(form.email);
          setStage("otp");
          setSuccessMsg(res.message || `Verification code sent to ${form.email}`);
          // Dev mode: if SMTP is not configured, server returns OTP for testing
          if (res.devOtp) {
            setOtp(res.devOtp);
            setSuccessMsg(`[Dev Mode] OTP auto-filled: ${res.devOtp}. In production, it will be sent to your email.`);
          }
        } else {
          navigate(location.state?.from || "/", { replace: true });
        }
      } else {
        await login(form.email, form.password);
        navigate(location.state?.from || "/", { replace: true });
      }
    } catch (err) {
      setErrors(err?.response?.data?.errors || {});
      setServerError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  // ── Submit 6-digit OTP
  const submitOtp = async (e) => {
    e.preventDefault();
    setServerError("");
    if (otp.length < 6) return setServerError("Please enter the full 6-digit verification code.");
    setBusy(true);
    try {
      await verifyOtp(pendingEmail, otp);
      setStage("verified");
      setTimeout(() => navigate(location.state?.from || "/", { replace: true }), 1800);
    } catch (err) {
      setServerError(errMsg(err));
      setOtp("");
    } finally {
      setBusy(false);
    }
  };

  // ── Resend OTP with 30s cooldown
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setBusy(true);
    setServerError("");
    try {
      const res = await resendOtp(pendingEmail);
      setSuccessMsg(res.message || "A fresh verification code has been sent!");
      if (res.devOtp) {
        setOtp(res.devOtp);
        setSuccessMsg(`[Dev Mode] New OTP auto-filled: ${res.devOtp}`);
      }
      setResendCooldown(30);
      const t = setInterval(() => {
        setResendCooldown((s) => {
          if (s <= 1) { clearInterval(t); return 0; }
          return s - 1;
        });
      }, 1000);
    } catch (err) {
      setServerError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const fieldError = (k) => touched[k] && errors[k];

  return (
    <div className="auth-page">
      {/* ── LEFT: Brand panel */}
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

      {/* ── RIGHT: Form panel */}
      <section className="auth-form-wrap">

        {/* ── STAGE: FORM ─────────────────────────────── */}
        {stage === "form" && (
          <form className="auth-card" onSubmit={submit} noValidate>
            <div className="brand brand-mobile-auth">▸ Dev<b>Recall</b></div>
            <h1>{isSignup ? "Create your account" : "Welcome back"}</h1>
            <p className="muted">
              {isSignup
                ? "Start revising in under a minute. We'll verify your email."
                : "Log in to continue your revision."}
            </p>

            {serverError && <div className="alert alert-error" role="alert">{serverError}</div>}

            {isSignup && (
              <div className="field">
                <label htmlFor="name">Full name</label>
                <input id="name" value={form.name} onChange={set("name")} onBlur={blur("name")}
                  autoComplete="name" placeholder="e.g. Nandini Sharma" aria-invalid={!!fieldError("name")} />
                {fieldError("name") && <small className="field-error">{errors.name}</small>}
              </div>
            )}

            <div className="field">
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" value={form.email} onChange={set("email")} onBlur={blur("email")}
                autoComplete="email" placeholder="you@example.com" aria-invalid={!!fieldError("email")} />
              {fieldError("email") && <small className="field-error">{errors.email}</small>}
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="pw-wrap">
                <input id="password" type={showPw ? "text" : "password"} value={form.password}
                  onChange={set("password")} onBlur={blur("password")}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  placeholder={isSignup ? "At least 8 characters, letters + numbers" : "Your password"}
                  aria-invalid={!!fieldError("password")} />
                <button type="button" className="pw-toggle" onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? "Hide password" : "Show password"}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldError("password") && <small className="field-error">{errors.password}</small>}
            </div>

            <button className="btn btn-primary btn-block" disabled={busy}>
              {busy ? <><Spinner /> Please wait…</> : isSignup ? "Create Account & Verify Email" : "Log in"}
            </button>

            <p className="switch muted">
              {isSignup ? "Already have an account? " : "New to DevRecall? "}
              <Link to={isSignup ? "/login" : "/signup"}>{isSignup ? "Log in" : "Create an account"}</Link>
            </p>
          </form>
        )}

        {/* ── STAGE: OTP VERIFICATION ─────────────────── */}
        {stage === "otp" && (
          <form className="auth-card otp-card" onSubmit={submitOtp} noValidate>
            <div className="otp-icon-wrap">
              <Mail size={36} className="otp-icon" />
            </div>
            <h1>Verify your email</h1>
            <p className="muted">
              We sent a <strong>6-digit code</strong> to <strong>{pendingEmail}</strong>.<br />
              Enter it below to activate your account.
            </p>

            {serverError && <div className="alert alert-error" role="alert">{serverError}</div>}
            {successMsg && <div className="alert alert-success" role="alert">{successMsg}</div>}

            <div className="field" style={{ alignItems: "center" }}>
              <label>Verification Code</label>
              <OtpInputRow otp={otp} setOtp={setOtp} />
            </div>

            <button className="btn btn-primary btn-block" disabled={busy || otp.length < 6}>
              {busy ? <><Spinner /> Verifying…</> : <><ShieldCheck size={16} /> Verify & Activate Account</>}
            </button>

            <div className="otp-resend-row">
              <span className="muted small">Didn't receive the code?</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleResend}
                disabled={busy || resendCooldown > 0}
              >
                <RotateCcw size={13} />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
              </button>
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setStage("form")}
              style={{ width: "100%", marginTop: 4 }}
            >
              ← Back to Sign Up
            </button>
          </form>
        )}

        {/* ── STAGE: VERIFIED SUCCESS ─────────────────── */}
        {stage === "verified" && (
          <div className="auth-card otp-card" style={{ textAlign: "center" }}>
            <CheckCircle2 size={56} style={{ color: "#22c55e", margin: "0 auto 16px" }} />
            <h1>Email Verified!</h1>
            <p className="muted">Your account is active. Redirecting you to your dashboard…</p>
            <div style={{ marginTop: 16 }}>
              <Spinner />
            </div>
          </div>
        )}

      </section>
    </div>
  );
}
