import { AlertCircle, Loader2 } from "lucide-react";

export const Spinner = ({ size = 18 }) => <Loader2 size={size} className="spin" aria-hidden="true" />;

export const Loading = ({ text = "Loading…" }) => (
  <div className="center-box" role="status">
    <Spinner size={26} />
    <p>{text}</p>
  </div>
);

export const ErrorBox = ({ message, onRetry }) => (
  <div className="alert alert-error" role="alert">
    <AlertCircle size={18} />
    <span>{message}</span>
    {onRetry && <button className="btn btn-ghost btn-sm" onClick={onRetry}>Retry</button>}
  </div>
);

export const PageHeader = ({ title, sub, children }) => (
  <div className="page-header">
    <div>
      <h1>{title}</h1>
      {sub && <p className="muted">{sub}</p>}
    </div>
    {children}
  </div>
);

export const ProgressBar = ({ value, max, color }) => {
  const p = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="bar" role="progressbar" aria-valuenow={p} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${p}%`, background: color || undefined }} />
    </div>
  );
};

// Small line chart of quiz scores (0-100%), drawn with plain SVG
export function TrendChart({ values }) {
  if (!values.length) return <p className="muted small">Take a quiz to see your score trend here.</p>;
  const W = 300, H = 120, padX = 14, padY = 12;
  const x = (i) => (values.length === 1 ? W / 2 : padX + (i * (W - 2 * padX)) / (values.length - 1));
  const y = (v) => H - padY - (v / 100) * (H - 2 * padY);
  const pts = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="trend" role="img" aria-label={`Score trend: ${values.join("%, ")}%`}>
      {[0, 50, 100].map((g) => (
        <g key={g}>
          <line x1={padX} x2={W - padX} y1={y(g)} y2={y(g)} className="grid-line" />
          <text x={0} y={y(g) + 3} className="axis-text">{g}</text>
        </g>
      ))}
      {values.length > 1 && <polyline points={pts} className="trend-line" fill="none" />}
      {values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="4" className="trend-dot" />)}
    </svg>
  );
}
