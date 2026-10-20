import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BarChart3, BookOpen, ClipboardCheck, Flame, HelpCircle, LayoutDashboard, LogOut, MessageSquare, Moon, Sun } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../utils/helpers";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/subjects", label: "Subjects", icon: BookOpen },
  { to: "/interview-vault", label: "Interview Vault", icon: HelpCircle },
  { to: "/chat", label: "AI Tutor", icon: MessageSquare },
  { to: "/quiz", label: "Quiz", icon: ClipboardCheck },
  { to: "/progress", label: "Progress", icon: BarChart3 },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [theme, toggleTheme] = useTheme();
  const navigate = useNavigate();
  const streak = user?.streak?.current ?? 0;

  const doLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app">
      {/* Sidebar (desktop) */}
      <aside className="sidebar">
        <div className="brand">▸ Dev<b>Recall</b></div>
        <nav aria-label="Main">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="user-chip">
            <div className="avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div className="user-meta">
              <strong>{user?.name}</strong>
              <span>{user?.email}</span>
            </div>
          </div>
          <div className="foot-actions">
            <button className="btn btn-ghost btn-sm" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />} {theme === "dark" ? "Light" : "Dark"}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={doLogout}><LogOut size={16} /> Logout</button>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="brand brand-mobile">▸ Dev<b>Recall</b></div>
          <div className="topbar-right">
            <div className={"streak-pill" + (streak ? " on" : "")} title="Days in a row you studied">
              <Flame size={16} /> {streak} day streak
            </div>
            <button className="btn btn-ghost btn-icon only-mobile" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="btn btn-ghost btn-icon only-mobile" onClick={doLogout} aria-label="Log out">
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>

      {/* Bottom navigation (mobile) */}
      <nav className="bottom-nav" aria-label="Main mobile">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => "bn-link" + (isActive ? " active" : "")}>
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
