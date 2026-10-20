import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  MessageSquare,
  HelpCircle,
  ExternalLink,
  Edit3,
  Save,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Sparkles,
  Layers,
  Flame,
  FileCode2,
} from "lucide-react";
import api, { errMsg } from "../api";
import { useAuth } from "../context/AuthContext";
import { ErrorBox, Loading, Spinner } from "../components/ui";

export default function Topic() {
  const { id, topicId } = useParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [quizBusy, setQuizBusy] = useState(false);

  // Active Tab: "deepdive" | "overview" | "qa" | "notes" | "refs"
  const [activeTab, setActiveTab] = useState("deepdive");

  // Dynamic AI generation states
  const [moreQBusy, setMoreQBusy] = useState(false);
  const [deepDiveBusy, setDeepDiveBusy] = useState(false);

  // Accordion state for interview questions
  const [openQuestions, setOpenQuestions] = useState({ 0: true });

  // Personal Notes state
  const [noteContent, setNoteContent] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteStatus, setNoteStatus] = useState("");
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    setData(null);
    setErr("");
    setOpenQuestions({ 0: true });
    setNoteContent("");
    setNoteStatus("");

    // Load topic details
    api
      .get(`/subjects/${id}/topics/${topicId}`)
      .then((r) => {
        setData(r.data);
        // Default to deepdive if available, otherwise overview
        if (r.data.topic?.deepDive) {
          setActiveTab("deepdive");
        } else {
          setActiveTab("overview");
        }
      })
      .catch((e) => setErr(errMsg(e)));

    // Load user's personal notes for this topic
    api
      .get(`/notes/${id}/${topicId}`)
      .then((r) => {
        if (r.data?.content) {
          setNoteContent(r.data.content);
          setNoteStatus("Saved to cloud");
        }
      })
      .catch(() => {});

    window.scrollTo(0, 0);
  }, [id, topicId]);

  const toggleDone = async () => {
    setBusy(true);
    try {
      const completed = !data.completed;
      await api.post("/progress/toggle", { subjectId: id, topicId, completed });
      setData((d) => ({ ...d, completed }));
      if (completed) refreshUser();
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const startQuiz = async () => {
    setQuizBusy(true);
    try {
      const { data: quiz } = await api.post("/quiz/generate", { subjectId: id, topicId });
      navigate(`/quiz/${quiz.quizId}`, { state: { quiz } });
    } catch (e) {
      setErr(errMsg(e));
      setQuizBusy(false);
    }
  };

  const toggleQuestion = (index) => {
    setOpenQuestions((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Generate 5 More Interview Questions with AI (Groq)
  const generateMoreQuestions = async () => {
    setMoreQBusy(true);
    try {
      const { data: res } = await api.post(`/subjects/${id}/topics/${topicId}/more-questions`);
      setData((prev) => ({
        ...prev,
        topic: {
          ...prev.topic,
          interviewQuestions: res.interviewQuestions,
        },
      }));
      const currentLength = data.topic.interviewQuestions?.length || 0;
      setOpenQuestions((prev) => ({ ...prev, [currentLength]: true }));
    } catch (e) {
      alert("Failed to generate questions: " + errMsg(e));
    } finally {
      setMoreQBusy(false);
    }
  };

  // Generate or regenerate Deep Dive Study Guide
  const generateDeepDive = async () => {
    setDeepDiveBusy(true);
    try {
      const { data: res } = await api.post(`/subjects/${id}/topics/${topicId}/deep-dive`);
      setData((prev) => ({
        ...prev,
        topic: {
          ...prev.topic,
          deepDive: res.deepDive,
        },
      }));
      setActiveTab("deepdive");
    } catch (e) {
      alert("Failed to generate deep dive: " + errMsg(e));
    } finally {
      setDeepDiveBusy(false);
    }
  };

  // Save personal notes
  const saveNote = async (contentToSave) => {
    const text = contentToSave ?? noteContent;
    setNoteSaving(true);
    try {
      await api.post("/notes", {
        subjectId: id,
        topicId,
        content: text,
      });
      setNoteStatus("Saved just now");
    } catch (e) {
      setNoteStatus("Failed to save: " + errMsg(e));
    } finally {
      setNoteSaving(false);
    }
  };

  const handleNoteChange = (e) => {
    const val = e.target.value;
    setNoteContent(val);
    setNoteStatus("Unsaved changes…");

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveNote(val);
    }, 2000);
  };

  if (err && !data) return <ErrorBox message={err} />;
  if (!data) return <Loading text="Loading topic…" />;
  const { subject, topic } = data;
  const questionsList = topic.interviewQuestions || [];
  const refList = topic.references || [];

  return (
    <article className="topic-page">
      <Link to={`/subjects/${id}`} className="back">
        ← {subject.icon} {subject.name}
      </Link>

      <div className="topic-hero-header">
        <div className="eyebrow">
          Topic {data.index + 1} of {data.total} • {subject.name}
        </div>
        <h1>{topic.title}</h1>
        {err && <ErrorBox message={err} />}
        <p className="lead">{topic.summary}</p>
      </div>

      {/* TOPIC TABS NAVIGATION */}
      <div className="topic-nav-tabs">
        <button
          className={`topic-tab-btn ${activeTab === "deepdive" ? "active" : ""}`}
          onClick={() => setActiveTab("deepdive")}
        >
          <Layers size={16} />
          <span>Master Deep Dive</span>
          {topic.deepDive && <span className="tab-pill-dot" title="Study guide ready" />}
        </button>

        <button
          className={`topic-tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <BookOpen size={16} />
          <span>Overview & Code</span>
        </button>

        <button
          className={`topic-tab-btn ${activeTab === "qa" ? "active" : ""}`}
          onClick={() => setActiveTab("qa")}
        >
          <HelpCircle size={16} />
          <span>Interview Q&A ({questionsList.length})</span>
        </button>

        <button
          className={`topic-tab-btn ${activeTab === "notes" ? "active" : ""}`}
          onClick={() => setActiveTab("notes")}
        >
          <Edit3 size={16} />
          <span>My Notes</span>
          {noteContent && <span className="tab-pill-dot saved" title="Notes saved" />}
        </button>

        {refList.length > 0 && (
          <button
            className={`topic-tab-btn ${activeTab === "refs" ? "active" : ""}`}
            onClick={() => setActiveTab("refs")}
          >
            <ExternalLink size={16} />
            <span>References ({refList.length})</span>
          </button>
        )}
      </div>

      {/* TAB CONTENT 1: MASTER DEEP DIVE */}
      {activeTab === "deepdive" && (
        <section className="card deep-dive-section">
          <div className="section-title-row">
            <div>
              <h3>
                <Layers size={18} style={{ verticalAlign: "middle", marginRight: 8, color: "var(--accent)" }} />
                In-Depth Architecture & Mechanics Guide
              </h3>
              <span className="small muted">Internals, memory layout, and production gotchas</span>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={generateDeepDive}
              disabled={deepDiveBusy}
              title="Generate or update deep dive with AI"
            >
              {deepDiveBusy ? (
                <>
                  <Spinner size={13} /> Generating…
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>{topic.deepDive ? "Regenerate Guide" : "Generate Deep Dive Guide"}</span>
                </>
              )}
            </button>
          </div>

          {topic.deepDive ? (
            <div className="deep-dive-content markdown-rendered">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{topic.deepDive}</ReactMarkdown>
            </div>
          ) : (
            <div className="deep-dive-prompt-box">
              <h3>Need a complete textbook-quality breakdown?</h3>
              <p className="muted small">
                Click below to generate in-depth architecture diagrams, under-the-hood engine mechanics, and senior
                interview trade-offs for <strong>{topic.title}</strong>.
              </p>
              <button
                className="btn btn-primary btn-sm"
                onClick={generateDeepDive}
                disabled={deepDiveBusy}
                style={{ marginTop: 12 }}
              >
                {deepDiveBusy ? (
                  <>
                    <Spinner size={13} /> Analyzing Internals with Groq…
                  </>
                ) : (
                  <>
                    <Sparkles size={14} /> Generate Complete Deep Dive (Groq)
                  </>
                )}
              </button>
            </div>
          )}
        </section>
      )}

      {/* TAB CONTENT 2: OVERVIEW & CODE */}
      {activeTab === "overview" && (
        <div className="topic-tab-pane">
          <section className="card">
            <h3>
              <BookOpen size={17} style={{ verticalAlign: "middle", marginRight: 8, color: "var(--accent-text)" }} />
              Key Placement Points
            </h3>
            <ul className="keypoints">
              {topic.keyPoints.map((k, i) => (
                <li key={i}>
                  <Check size={16} /> <span>{k}</span>
                </li>
              ))}
            </ul>
          </section>

          {topic.example && (
            <section className="card code-card" style={{ marginTop: 16 }}>
              <div className="code-head">
                <span>Runnable Code Snippet</span>
                <span className="mono">{topic.example.language}</span>
              </div>
              <pre>
                <code>{topic.example.code}</code>
              </pre>
            </section>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: INTERVIEW Q&A */}
      {activeTab === "qa" && (
        <section className="card interview-qa-section">
          <div className="section-title-row">
            <div>
              <h3>
                <HelpCircle size={18} style={{ verticalAlign: "middle", marginRight: 8, color: "var(--accent)" }} />
                Placement Interview Questions
              </h3>
              <span className="small muted">Real technical questions asked in company hiring rounds</span>
            </div>

            <button
              className="btn btn-primary btn-sm"
              onClick={generateMoreQuestions}
              disabled={moreQBusy}
              title="Generate 5 more real interview questions with answers"
            >
              {moreQBusy ? (
                <>
                  <Spinner size={13} /> Generating…
                </>
              ) : (
                <>
                  <Flame size={14} />
                  <span>+ Generate 5 More Questions</span>
                </>
              )}
            </button>
          </div>

          <p className="small muted" style={{ marginBottom: 14 }}>
            Click any question to inspect the interviewer's expected technical answer:
          </p>

          {questionsList.length === 0 ? (
            <div className="deep-dive-prompt-box">
              <p className="small muted">No interview questions generated yet for this topic.</p>
              <button
                className="btn btn-primary btn-sm"
                onClick={generateMoreQuestions}
                disabled={moreQBusy}
                style={{ marginTop: 8 }}
              >
                {moreQBusy ? <Spinner size={13} /> : <Flame size={14} />} Generate Interview Questions
              </button>
            </div>
          ) : (
            <div className="qa-accordion">
              {questionsList.map((qa, i) => {
                const isOpen = !!openQuestions[i];
                return (
                  <div key={i} className={`qa-card ${isOpen ? "open" : ""}`}>
                    <button
                      className="qa-question-btn"
                      onClick={() => toggleQuestion(i)}
                      aria-expanded={isOpen}
                    >
                      <span className="qa-num">Q{i + 1}</span>
                      <span className="qa-title">{qa.question}</span>
                      <span className="qa-toggle-icon">
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="qa-answer-box">
                        <div className="qa-answer-tag">Interviewer's Expected Answer:</div>
                        <p>{qa.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB CONTENT 4: MY NOTES */}
      {activeTab === "notes" && (
        <section className="card personal-notes-card">
          <div className="section-title-row">
            <div>
              <h3>
                <Edit3 size={17} style={{ verticalAlign: "middle", marginRight: 8, color: "var(--accent-text)" }} />
                My Personal Interview Notes
              </h3>
              <span className="small muted">Saved permanently to your cloud account</span>
            </div>
            <div className="notes-actions">
              {noteStatus && (
                <span
                  className={`small notes-status ${
                    noteStatus.includes("just now") || noteStatus.includes("Saved") ? "ok" : "muted"
                  }`}
                >
                  {noteStatus}
                </span>
              )}
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => saveNote()}
                disabled={noteSaving}
                title="Save notes to cloud"
              >
                {noteSaving ? <Spinner size={13} /> : <Save size={14} />}
                <span>Save</span>
              </button>
            </div>
          </div>
          <p className="small muted" style={{ marginBottom: 12 }}>
            Jot down your mental models, recruiter tips, or tricky bugs for <strong>{topic.title}</strong>. Access
            all your notes anytime in the <strong>Interview Vault</strong>.
          </p>
          <textarea
            className="personal-notes-input"
            value={noteContent}
            onChange={handleNoteChange}
            placeholder="Write your personal explanation, interviewer tips, or edge cases here..."
            rows={8}
          />
        </section>
      )}

      {/* TAB CONTENT 5: REFERENCES */}
      {activeTab === "refs" && (
        <section className="card references-card">
          <h3>
            <ExternalLink size={17} style={{ verticalAlign: "middle", marginRight: 8, color: "var(--accent-text)" }} />
            Curated Documentation & Deep-Dive References
          </h3>
          <p className="small muted" style={{ marginBottom: 12 }}>
            Official documentation, RFCs, and verified learning resources for comprehensive study:
          </p>
          <div className="references-grid">
            {refList.map((ref, i) => (
              <a
                key={i}
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="reference-link-pill"
              >
                <span className="ref-title">{ref.title}</span>
                <ExternalLink size={13} className="ref-icon" />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Global Action Bar */}
      <div className="action-bar" style={{ marginTop: 24 }}>
        <button
          className={"btn " + (data.completed ? "btn-success" : "btn-primary")}
          onClick={toggleDone}
          disabled={busy}
        >
          {busy ? <Spinner /> : <CheckCircle2 size={16} />}
          {data.completed ? "Completed (click to undo)" : "Mark as completed"}
        </button>
        <button className="btn btn-ghost" onClick={startQuiz} disabled={quizBusy}>
          {quizBusy ? (
            <>
              <Spinner /> Preparing…
            </>
          ) : (
            <>
              <ClipboardCheck size={16} /> Quiz me on this
            </>
          )}
        </button>
        <Link className="btn btn-ghost" to={`/chat?subject=${id}&topic=${topicId}`}>
          <MessageSquare size={16} /> Ask AI about this
        </Link>
      </div>

      <nav className="pager" aria-label="Topic navigation">
        {data.prevId ? (
          <Link to={`/subjects/${id}/topics/${data.prevId}`} className="btn btn-ghost">
            <ChevronLeft size={16} /> Previous
          </Link>
        ) : (
          <span />
        )}
        {data.nextId ? (
          <Link to={`/subjects/${id}/topics/${data.nextId}`} className="btn btn-ghost">
            Next topic <ChevronRight size={16} />
          </Link>
        ) : (
          <Link to={`/subjects/${id}`} className="btn btn-ghost">
            Back to topics
          </Link>
        )}
      </nav>
    </article>
  );
}
