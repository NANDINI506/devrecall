import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle2,
  Circle,
  ClipboardCheck,
  MessageSquare,
  Sparkles,
  Plus,
  Trash2,
  Sliders,
  X,
  BookOpen,
} from "lucide-react";
import api, { errMsg } from "../api";
import { ErrorBox, Loading, ProgressBar, Spinner } from "../components/ui";

export default function SubjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [s, setS] = useState(null);
  const [err, setErr] = useState("");
  const [quizBusy, setQuizBusy] = useState(false);
  const [expandBusy, setExpandBusy] = useState(false);

  // Regeneration modal
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [regenCount, setRegenCount] = useState(15);
  const [regenFocus, setRegenFocus] = useState("Full Comprehensive Placement Course (Core to Advanced)");
  const [regenBusy, setRegenBusy] = useState(false);

  const loadSubject = () => {
    setErr("");
    api
      .get(`/subjects/${id}`)
      .then((r) => setS(r.data))
      .catch((e) => setErr(errMsg(e)));
  };

  useEffect(() => {
    setS(null);
    loadSubject();
  }, [id]);

  const startQuiz = async () => {
    setQuizBusy(true);
    try {
      const { data } = await api.post("/quiz/generate", { subjectId: id });
      navigate(`/quiz/${data.quizId}`, { state: { quiz: data } });
    } catch (e) {
      setErr(errMsg(e));
      setQuizBusy(false);
    }
  };

  // Expand syllabus with 5 more advanced topics
  const expandSyllabus = async () => {
    setExpandBusy(true);
    try {
      const { data: res } = await api.post(`/subjects/${id}/expand`, { count: 5 });
      alert(res.message || "Added 5 more advanced topics!");
      loadSubject();
    } catch (e) {
      alert("Failed to expand course: " + errMsg(e));
    } finally {
      setExpandBusy(false);
    }
  };

  // Regenerate syllabus with custom count & focus
  const handleRegenerate = async (e) => {
    e.preventDefault();
    setRegenBusy(true);
    try {
      await api.post("/subjects/generate", {
        name: s.name,
        topicCount: Number(regenCount) || 15,
        focus: regenFocus,
        regenerate: true,
      });
      setShowRegenModal(false);
      loadSubject();
    } catch (e) {
      alert("Failed to regenerate course: " + errMsg(e));
    } finally {
      setRegenBusy(false);
    }
  };

  // Delete custom subject
  const deleteSubject = async () => {
    if (!window.confirm(`Are you sure you want to delete ${s.name}?`)) return;
    try {
      await api.delete(`/subjects/${id}`);
      navigate("/subjects");
    } catch (e) {
      alert("Failed to delete subject: " + errMsg(e));
    }
  };

  if (err) return <ErrorBox message={err} />;
  if (!s) return <Loading text="Loading subject…" />;

  return (
    <div className="subject-detail-page">
      <Link to="/subjects" className="back">
        ← All subjects
      </Link>

      <header className="subject-hero" style={{ "--tint": s.color }}>
        <span className="sc-icon big">{s.icon}</span>
        <div className="sh-main">
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1>{s.name}</h1>
            {s.isCustom && <span className="badge ai">AI Generated</span>}
          </div>
          <p className="muted">{s.description}</p>
          <div className="sh-progress">
            <ProgressBar value={s.completedCount} max={s.topicCount} color={s.color} />
            <span className="muted small">
              {s.completedCount}/{s.topicCount} topics completed
            </span>
          </div>
        </div>

        <div className="sh-actions">
          <button className="btn btn-primary" onClick={startQuiz} disabled={quizBusy}>
            {quizBusy ? (
              <>
                <Spinner /> Preparing quiz…
              </>
            ) : (
              <>
                <ClipboardCheck size={16} /> Quiz on {s.name}
              </>
            )}
          </button>
          <Link className="btn btn-ghost" to={`/chat?subject=${s._id}`}>
            <MessageSquare size={16} /> Ask AI tutor
          </Link>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowRegenModal(true)}
            title="Customize and regenerate syllabus with chosen topic count"
          >
            <Sliders size={14} /> Customize / Regenerate Course
          </button>
          {s.isCustom && (
            <button className="btn btn-ghost btn-sm" onClick={deleteSubject} title="Delete course">
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      </header>

      {/* SYLLABUS CONTROLS */}
      <div className="syllabus-header-row">
        <div>
          <h3>Course Modules ({s.topics.length} Topics)</h3>
          <span className="small muted">Progressively structured from fundamentals to production architecture</span>
        </div>

        <button
          className="btn btn-ghost btn-sm"
          onClick={expandSyllabus}
          disabled={expandBusy}
          title="Use AI to generate 5 more advanced topics without losing current progress"
        >
          {expandBusy ? (
            <>
              <Spinner size={13} /> Generating 5 topics…
            </>
          ) : (
            <>
              <Plus size={14} />
              <span>+ Add 5 More Advanced Topics</span>
            </>
          )}
        </button>
      </div>

      <ol className="topic-list">
        {s.topics.map((t, i) => (
          <li key={t._id}>
            <Link to={`/subjects/${s._id}/topics/${t._id}`} className={"topic-row" + (t.completed ? " done" : "")}>
              <span className="t-num">{i + 1}</span>
              <div className="t-main">
                <strong>{t.title}</strong>
                <span className="muted small clamp">{t.summary}</span>
              </div>
              {t.completed ? (
                <CheckCircle2 size={22} className="ok" aria-label="Completed" />
              ) : (
                <Circle size={22} className="faint" aria-label="Not completed" />
              )}
            </Link>
          </li>
        ))}
      </ol>

      {/* REGENERATION MODAL */}
      {showRegenModal && (
        <div className="modal-backdrop" onClick={() => !regenBusy && setShowRegenModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={18} style={{ color: "var(--accent)" }} />
                <h3>Customize Syllabus: {s.name}</h3>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowRegenModal(false)}
                disabled={regenBusy}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRegenerate} className="modal-body">
              <p className="small muted">
                Specify how comprehensive you want this course to be. AI (Groq) will generate an in-depth
                master syllabus with interview questions and references.
              </p>

              <div className="form-group">
                <label>Number of Topics: <strong>{regenCount} Topics</strong></label>
                <input
                  type="range"
                  min="6"
                  max="25"
                  step="1"
                  value={regenCount}
                  onChange={(e) => setRegenCount(e.target.value)}
                  className="range-slider"
                />
                <div className="range-labels">
                  <span>6 (Quick Cram)</span>
                  <span>15 (Standard)</span>
                  <span>25 (Master Roadmap)</span>
                </div>
              </div>

              <div className="form-group">
                <label>Course Focus & Target Depth</label>
                <select value={regenFocus} onChange={(e) => setRegenFocus(e.target.value)}>
                  <option value="Full Comprehensive Placement Course (Core to Advanced)">
                    Full Comprehensive Course (Core to Production Architecture)
                  </option>
                  <option value="Product Companies & FAANG Interview Prep (Deep Internals & Hard Edge Cases)">
                    Product Companies & FAANG Focus (Deep Internals & Gotchas)
                  </option>
                  <option value="Hands-on Practical Architecture & System Design Patterns">
                    Practical Architecture & Production Patterns
                  </option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowRegenModal(false)}
                  disabled={regenBusy}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={regenBusy}>
                  {regenBusy ? (
                    <>
                      <Spinner size={14} /> Generating {regenCount} Topics…
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} /> Generate {regenCount}-Topic Syllabus (Groq)
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
