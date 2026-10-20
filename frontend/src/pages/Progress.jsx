import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errMsg } from "../api";
import { ErrorBox, Loading, PageHeader, ProgressBar, TrendChart } from "../components/ui";
import { fmtDate, pct } from "../utils/helpers";

export default function Progress() {
  const [dash, setDash] = useState(null);
  const [history, setHistory] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    Promise.all([api.get("/dashboard"), api.get("/quiz/history")])
      .then(([d, h]) => { setDash(d.data); setHistory(h.data); })
      .catch((e) => setErr(errMsg(e)));
  }, []);

  if (err) return <ErrorBox message={err} />;
  if (!dash || !history) return <Loading text="Loading your progress…" />;

  return (
    <>
      <PageHeader title="Progress" sub="Your revision at a glance." />

      <div className="two-col">
        <section className="card">
          <h3>Mastery by subject</h3>
          <div className="subject-progress-list">
            {dash.subjects.map((s) => (
              <Link key={s._id} to={`/subjects/${s._id}`} className="sp-row">
                <span className="sp-icon" style={{ background: s.color + "22" }}>{s.icon}</span>
                <div className="sp-main">
                  <div className="sp-top"><strong>{s.name}</strong><span className="muted small">{pct(s.completedCount, s.topicCount)}%</span></div>
                  <ProgressBar value={s.completedCount} max={s.topicCount} color={s.color} />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="card">
          <h3>Quiz score trend</h3>
          <TrendChart values={dash.scoreTrend} />
          <div className="mini-stats">
            <div><strong>{dash.stats.quizzesTaken}</strong><span className="muted small">quizzes</span></div>
            <div><strong>{dash.stats.quizzesTaken ? dash.stats.avgScore + "%" : "–"}</strong><span className="muted small">average</span></div>
            <div><strong>{dash.streak.longest}</strong><span className="muted small">best streak</span></div>
          </div>
        </section>
      </div>

      <section className="card">
        <h3>Quiz history</h3>
        {history.length === 0 ? (
          <p className="muted">No quizzes yet. <Link to="/quiz">Take your first quiz</Link></p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Subject / topic</th><th>Score</th><th></th></tr></thead>
              <tbody>
                {history.map((q) => (
                  <tr key={q.quizId}>
                    <td>{fmtDate(q.submittedAt)}</td>
                    <td><strong>{q.subjectName}</strong>{q.topicTitle && <span className="muted"> · {q.topicTitle}</span>}</td>
                    <td><span className={"badge " + (q.percent >= 70 ? "good" : q.percent >= 40 ? "mid" : "low")}>{q.score}/{q.total} ({q.percent}%)</span></td>
                    <td><Link to={`/quiz/${q.quizId}`}>Review</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
