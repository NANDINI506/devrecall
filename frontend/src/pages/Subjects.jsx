import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Sliders, X, BookOpen, Layers } from "lucide-react";
import api, { errMsg } from "../api";
import { ErrorBox, Loading, PageHeader, ProgressBar, Spinner } from "../components/ui";

const IDEAS = ["Rust", "GraphQL", "Computer Networks", "Docker", "React", "System Design", "Kubernetes", "Next.js"];

export default function Subjects() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState(null);
  const [err, setErr] = useState("");
  const [name, setName] = useState("");
  const [topicCount, setTopicCount] = useState(15);
  const [focus, setFocus] = useState("Full Comprehensive Placement Course (Zero to Hero)");
  const [busy, setBusy] = useState(false);
  const [genErr, setGenErr] = useState("");

  // Quick customize / regenerate modal for existing card
  const [activeSubject, setActiveSubject] = useState(null);
  const [modalCount, setModalCount] = useState(15);
  const [modalFocus, setModalFocus] = useState("Full Comprehensive Placement Course (Zero to Hero)");
  const [modalBusy, setModalBusy] = useState(false);

  const fetchSubjects = () => {
    api
      .get("/subjects")
      .then((r) => setSubjects(r.data))
      .catch((e) => setErr(errMsg(e)));
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const generate = async (value) => {
    const subject = (value ?? name).trim();
    if (!subject || busy) return;
    setBusy(true);
    setGenErr("");
    try {
      const { data } = await api.post("/subjects/generate", {
        name: subject,
        topicCount: Number(topicCount) || 15,
        focus,
      });
      navigate(`/subjects/${data.subject._id}`);
    } catch (e) {
      setGenErr(errMsg(e));
      setBusy(false);
    }
  };

  const handleModalRegenerate = async (e) => {
    e.preventDefault();
    if (!activeSubject) return;
    setModalBusy(true);
    try {
      await api.post("/subjects/generate", {
        name: activeSubject.name,
        topicCount: Number(modalCount) || 15,
        focus: modalFocus,
        regenerate: true,
      });
      setActiveSubject(null);
      fetchSubjects();
    } catch (e) {
      alert("Failed to regenerate course: " + errMsg(e));
    } finally {
      setModalBusy(false);
    }
  };

  if (err) return <ErrorBox message={err} />;
  if (!subjects) return <Loading text="Loading subjects…" />;

  return (
    <>
      <PageHeader title="Subjects" sub="Pick a subject to revise topic by topic or build custom courses." />

      {/* AI Course Generator */}
      <section className="card generator">
        <div className="gen-title">
          <Sparkles size={18} /> <strong>Add Any Subject or Full Placement Course</strong>
        </div>
        <p className="muted small">
          Not in the list or want a comprehensive curriculum? Type any technology or CS discipline. AI builds an in-depth topic-wise course with architecture deep dives, real interview questions, and code.
        </p>

        <form
          className="gen-form"
          onSubmit={(e) => {
            e.preventDefault();
            generate();
          }}
          style={{ flexDirection: "column", gap: 12 }}
        >
          <div style={{ display: "flex", gap: 8, width: "100%", flexWrap: "wrap" }}>
            <input
              style={{ flex: 1, minWidth: 240 }}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kotlin, Computer Networks, TypeScript, System Design, Golang…"
              maxLength={40}
              aria-label="Subject name"
              disabled={busy}
            />
            <button className="btn btn-primary" disabled={busy || !name.trim()}>
              {busy ? (
                <>
                  <Spinner /> Building Course…
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Generate Course
                </>
              )}
            </button>
          </div>

          {/* Curriculum Depth Controls */}
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", fontSize: 13 }}>
            <span className="muted">Curriculum Depth:</span>
            {[
              { count: 10, label: "10 Topics (Core)" },
              { count: 15, label: "15 Topics (Placement Bootcamp)" },
              { count: 25, label: "25 Topics (Full Master Course)" },
            ].map((opt) => (
              <button
                key={opt.count}
                type="button"
                className={`btn btn-sm ${topicCount === opt.count ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setTopicCount(opt.count)}
                disabled={busy}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </form>

        {busy && (
          <p className="muted small" style={{ marginTop: 8 }}>
            AI is writing your comprehensive syllabus with code and interview questions. This can take 10–25 seconds…
          </p>
        )}
        {genErr && (
          <div className="alert alert-error" role="alert" style={{ marginTop: 10 }}>
            {genErr}
          </div>
        )}

        <div className="chips">
          {IDEAS.map((i) => (
            <button key={i} className="chip" onClick={() => generate(i)} disabled={busy}>
              {i}
            </button>
          ))}
        </div>
      </section>

      {/* Subject Cards Grid */}
      <div className="subject-grid">
        {subjects.map((s) => (
          <div
            key={s._id}
            className="card subject-card"
            style={{ "--tint": s.color, position: "relative" }}
          >
            <Link to={`/subjects/${s._id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
              <div className="sc-top">
                <span className="sc-icon">{s.icon}</span>
                {s.isCustom && <span className="badge ai">AI generated</span>}
              </div>
              <h3>{s.name}</h3>
              <p className="muted small">{s.description}</p>
              <ProgressBar value={s.completedCount} max={s.topicCount} color={s.color} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                <span className="muted small">
                  {s.completedCount} of {s.topicCount} topics done
                </span>
                <span className="small" style={{ color: "var(--accent-text)", fontWeight: 600 }}>
                  {s.topicCount} modules →
                </span>
              </div>
            </Link>

            <button
              className="btn btn-ghost btn-sm"
              style={{
                marginTop: 12,
                width: "100%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                borderTop: "1px solid var(--border)",
                borderRadius: "0 0 12px 12px",
                padding: "8px 12px",
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveSubject(s);
              }}
              title="Regenerate syllabus with custom topic count"
            >
              <Sliders size={13} /> Customize & Expand Course
            </button>
          </div>
        ))}
      </div>

      {/* QUICK REGENERATE MODAL */}
      {activeSubject && (
        <div className="modal-backdrop" onClick={() => !modalBusy && setActiveSubject(null)}>
          <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Sliders size={18} className="badge-icon" />
                <h3>Customize Syllabus: {activeSubject.name}</h3>
              </div>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setActiveSubject(null)}
                disabled={modalBusy}
              >
                <X size={18} />
              </button>
            </div>

            <p className="muted small" style={{ marginBottom: 16 }}>
              Regenerate or expand the curriculum for <strong>{activeSubject.name}</strong>. Choose how many modules you want and the exact preparation focus.
            </p>

            <form onSubmit={handleModalRegenerate} className="modal-form">
              <div className="form-group">
                <label>
                  <strong>Course Scope / Topic Count: {modalCount} Topics</strong>
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                  {[
                    { cnt: 10, lbl: "10 Topics (Standard)" },
                    { cnt: 15, lbl: "15 Topics (Full Placement Bootcamp)" },
                    { cnt: 25, lbl: "25 Topics (Master Course)" },
                  ].map((item) => (
                    <button
                      key={item.cnt}
                      type="button"
                      className={`btn btn-sm ${modalCount === item.cnt ? "btn-primary" : "btn-ghost"}`}
                      onClick={() => setModalCount(item.cnt)}
                      disabled={modalBusy}
                    >
                      {item.lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>
                  <strong>Preparation Focus</strong>
                </label>
                <select
                  value={modalFocus}
                  onChange={(e) => setModalFocus(e.target.value)}
                  disabled={modalBusy}
                >
                  <option value="Full Comprehensive Placement Course (Zero to Hero)">
                    Full Comprehensive Placement Course (Zero to Hero)
                  </option>
                  <option value="Senior Level Deep-Dive: System Internals & Under-The-Hood Architecture">
                    Senior Level Deep-Dive: System Internals & Under-The-Hood Architecture
                  </option>
                  <option value="Top FAANG & Product Company Interview Questions & Live Coding Traps">
                    Top FAANG & Product Company Interview Questions & Live Coding Traps
                  </option>
                  <option value="Crash Course: 80/20 Rule for Tomorrow's Interview">
                    Crash Course: 80/20 Rule for Tomorrow's Interview
                  </option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setActiveSubject(null)}
                  disabled={modalBusy}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={modalBusy}>
                  {modalBusy ? (
                    <>
                      <Spinner /> Regenerating Course…
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} /> Regenerate {modalCount} Topics
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
