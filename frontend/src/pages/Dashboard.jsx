import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookCheck, Check, ClipboardList, Flame, Target } from "lucide-react";
import api, { errMsg } from "../api";
import { useAuth } from "../context/AuthContext";
import { ErrorBox, Loading, PageHeader, ProgressBar, TrendChart } from "../components/ui";
import { firstName, fmtDate, pct } from "../utils/helpers";

const Stat = ({ icon: Icon, label, value, hint, tone }) => (
  <div className={"card stat " + (tone || "")}>
    <div className="stat-icon"><Icon size={18} /></div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
    {hint && <div className="stat-hint">{hint}</div>}
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(() => {
    setErr("");
    api.get("/dashboard").then((r) => setD(r.data)).catch((e) => setErr(errMsg(e)));
  }, []);
  useEffect(load, [load]);

  if (err) return <ErrorBox message={err} onRetry={load} />;
  if (!d) return <Loading text="Loading your dashboard…" />;

  const overall = pct(d.stats.topicsCompleted, d.stats.totalTopics);

  return (
    <>
      <PageHeader
        title={`Hi ${firstName(user.name)}, ready to revise?`}
        sub={d.streak.current ? `You're on a ${d.streak.current}-day streak. Keep it going!` : "Complete a topic or take a quiz today to start your streak."}
      />

      <div className="stats-grid">
        <Stat icon={Flame} label="Day streak" value={d.streak.current} hint={`Best: ${d.streak.longest} days`} tone="accent" />
        <Stat icon={BookCheck} label="Topics completed" value={`${d.stats.topicsCompleted}/${d.stats.totalTopics}`} hint={`${overall}% of all topics`} />
        <Stat icon={ClipboardList} label="Quizzes taken" value={d.stats.quizzesTaken} />
        <Stat icon={Target} label="Average score" value={d.stats.quizzesTaken ? `${d.stats.avgScore}%` : "–"} hint={d.stats.quizzesTaken ? "across all quizzes" : "No quizzes yet"} />
      </div>

      <div className="dash-grid">
        <div className="col">
          {d.next ? (
            <Link to={`/subjects/${d.next.subjectId}/topics/${d.next.topicId}`} className="card continue-card">
              <span className="eyebrow">Continue learning</span>
              <h3>{d.next.icon} {d.next.subjectName}: {d.next.topicTitle}</h3>
              <p className="muted">{d.next.summary}</p>
              <span className="link-arrow">Open topic <ArrowRight size={16} /></span>
            </Link>
          ) : (
            <div className="card continue-card"><span className="eyebrow">All done</span><h3>🎉 You completed every topic!</h3><p className="muted">Generate a new subject to keep learning.</p><Link className="btn btn-primary btn-sm" to="/subjects">Add a subject</Link></div>
          )}

          <section className="card">
            <div className="card-head"><h3>Your subjects</h3><Link to="/subjects" className="small">View all</Link></div>
            <div className="subject-progress-list">
              {d.subjects.map((s) => (
                <Link key={s._id} to={`/subjects/${s._id}`} className="sp-row">
                  <span className="sp-icon" style={{ background: s.color + "22" }}>{s.icon}</span>
                  <div className="sp-main">
                    <div className="sp-top"><strong>{s.name}</strong><span className="muted small">{s.completedCount}/{s.topicCount}</span></div>
                    <ProgressBar value={s.completedCount} max={s.topicCount} color={s.color} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div className="col">
          <section className="card">
            <h3>This week</h3>
            <div className="week">
              {d.week.map((w) => (
                <div key={w.date} className={"day" + (w.active ? " active" : "") + (w.isToday ? " today" : "")}>
                  <span className="dot">{w.active ? <Check size={14} /> : null}</span>
                  <span className="lbl">{w.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <h3>Quiz score trend</h3>
            <TrendChart values={d.scoreTrend} />
          </section>

          <section className="card">
            <div className="card-head"><h3>Recent quizzes</h3><Link to="/progress" className="small">History</Link></div>
            {d.recentQuizzes.length === 0 ? (
              <p className="muted small">No quizzes yet. <Link to="/quiz">Take your first quiz</Link></p>
            ) : (
              <ul className="list">
                {d.recentQuizzes.map((q) => (
                  <li key={q.quizId}>
                    <Link to={`/quiz/${q.quizId}`} className="list-row">
                      <div><strong>{q.topicTitle || q.subjectName}</strong><span className="muted small">{q.topicTitle ? q.subjectName + " · " : "Full subject · "}{fmtDate(q.submittedAt)}</span></div>
                      <span className={"badge " + (q.percent >= 70 ? "good" : q.percent >= 40 ? "mid" : "low")}>{q.score}/{q.total}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
