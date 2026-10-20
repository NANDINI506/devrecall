import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  HelpCircle,
  Search,
  BookOpen,
  Edit3,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  Filter,
  FileText,
  Clock,
  Plus,
  Sliders,
  X,
  Building,
  Briefcase,
  Layers,
} from "lucide-react";
import api, { errMsg } from "../api";
import { ErrorBox, Loading, Spinner } from "../components/ui";

export default function InterviewVault() {
  const [tab, setTab] = useState("questions"); // "questions" | "notes"
  const [questions, setQuestions] = useState([]);
  const [notes, setNotes] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("ALL");
  const [openIndex, setOpenIndex] = useState({});

  // Market Question Generation Modal
  const [showGenModal, setShowGenModal] = useState(false);
  const [genSubject, setGenSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [genTopic, setGenTopic] = useState("");
  const [genRole, setGenRole] = useState("Fullstack / Backend SDE");
  const [genCompany, setGenCompany] = useState("Tier-1 / FAANG & Top Product Companies");
  const [genDifficulty, setGenDifficulty] = useState("Senior / Placement Level");
  const [genCount, setGenCount] = useState(5);
  const [genBusy, setGenBusy] = useState(false);
  const [genSuccess, setGenSuccess] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setErr("");
      const [qRes, nRes, sRes] = await Promise.all([
        api.get("/interview-questions").catch(() => ({ data: [] })),
        api.get("/notes").catch(() => ({ data: [] })),
        api.get("/subjects").catch(() => ({ data: [] })),
      ]);
      setQuestions(qRes.data || []);
      setNotes(nRes.data || []);
      setSubjectsList(sRes.data || []);
      if (!genSubject && sRes.data && sRes.data.length > 0) {
        setGenSubject(sRes.data[0].name);
      }
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Unique subjects for filter tabs
  const subjectsMap = {};
  questions.forEach((q) => {
    if (q.subjectName) {
      if (!subjectsMap[q.subjectName]) {
        subjectsMap[q.subjectName] = {
          name: q.subjectName,
          icon: q.subjectIcon || "📚",
          count: 0,
        };
      }
      subjectsMap[q.subjectName].count++;
    }
  });

  const subjectNames = ["ALL", ...Object.keys(subjectsMap)];

  // Filtered questions
  const filteredQuestions = questions.filter((q) => {
    const matchesSubject = selectedSubject === "ALL" || q.subjectName === selectedSubject;
    const query = search.toLowerCase();
    const matchesSearch =
      !query ||
      q.question.toLowerCase().includes(query) ||
      q.answer.toLowerCase().includes(query) ||
      q.topicTitle.toLowerCase().includes(query) ||
      q.subjectName.toLowerCase().includes(query);
    return matchesSubject && matchesSearch;
  });

  // Group questions by Topic when a specific subject is selected
  const groupedByTopic = {};
  filteredQuestions.forEach((q, idx) => {
    const key = q.topicTitle || "Core Concepts";
    if (!groupedByTopic[key]) {
      groupedByTopic[key] = {
        topicTitle: key,
        subjectId: q.subjectId,
        topicId: q.topicId,
        items: [],
      };
    }
    groupedByTopic[key].items.push({ ...q, globalIndex: idx });
  });

  // Filtered notes
  const filteredNotes = notes.filter((n) => {
    const query = search.toLowerCase();
    const subjName = n.subject?.name || "";
    return (
      !query ||
      n.content.toLowerCase().includes(query) ||
      subjName.toLowerCase().includes(query)
    );
  });

  const toggleQuestion = (idx) => {
    setOpenIndex((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const expandAll = () => {
    const next = {};
    filteredQuestions.forEach((_, i) => (next[i] = true));
    setOpenIndex(next);
  };

  const collapseAll = () => {
    setOpenIndex({});
  };

  // Submit Market Question Generator
  const handleGenerateMarketQuestions = async (e) => {
    e.preventDefault();
    const finalSubject = genSubject === "__custom__" ? customSubject.trim() : genSubject;
    if (!finalSubject) {
      alert("Please enter or select a subject name.");
      return;
    }

    setGenBusy(true);
    setGenSuccess("");
    try {
      const { data } = await api.post("/interview-questions/generate", {
        subjectName: finalSubject,
        topicTitle: genTopic.trim() || undefined,
        role: genRole,
        company: genCompany,
        difficulty: genDifficulty,
        count: Number(genCount) || 5,
      });

      setGenSuccess(data.message || "Questions successfully generated!");
      await fetchData();
      setSelectedSubject(finalSubject);
      setTimeout(() => {
        setShowGenModal(false);
        setGenSuccess("");
      }, 1200);
    } catch (err) {
      alert("Failed to generate questions: " + errMsg(err));
    } finally {
      setGenBusy(false);
    }
  };

  if (loading) return <Loading text="Loading your interview vault…" />;

  return (
    <div className="vault-page">
      {/* Header */}
      <div className="vault-header">
        <div>
          <span className="eyebrow">Career & Placement Center</span>
          <h1>Placement & Interview Vault</h1>
          <p className="muted small">
            Master real-world company questions, expected technical answers, and your personal revision notes across every subject.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {/* Market Questions Generator Button */}
          <button
            className="btn btn-primary"
            onClick={() => setShowGenModal(true)}
            title="Generate real-world company interview questions with AI"
          >
            <Sparkles size={16} />
            <span>Generate Market Questions</span>
          </button>

          {/* Tab switch */}
          <div className="vault-tabs">
            <button
              className={`btn btn-sm ${tab === "questions" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setTab("questions")}
            >
              <HelpCircle size={15} />
              <span>Questions ({questions.length})</span>
            </button>
            <button
              className={`btn btn-sm ${tab === "notes" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setTab("notes")}
            >
              <FileText size={15} />
              <span>My Notes ({notes.length})</span>
            </button>
          </div>
        </div>
      </div>

      {err && <ErrorBox message={err} />}

      {/* Search and Filters */}
      <div className="vault-search-row">
        <div className="vault-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder={
              tab === "questions"
                ? "Search questions by keyword (e.g. event loop, indexing, deadlocks, closures)..."
                : "Search your saved notes..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {tab === "questions" && (
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={expandAll} title="Expand all answers">
              Expand All
            </button>
            <button className="btn btn-ghost btn-sm" onClick={collapseAll} title="Collapse all answers">
              Collapse All
            </button>
          </div>
        )}
      </div>

      {/* SUBJECT TABS BAR */}
      {tab === "questions" && (
        <div className="vault-subject-tabs-container">
          <div className="vault-subject-tabs">
            <button
              className={`vault-tab-pill ${selectedSubject === "ALL" ? "active" : ""}`}
              onClick={() => setSelectedSubject("ALL")}
            >
              <span className="vault-tab-title">ALL SUBJECTS</span>
              <span className="vault-tab-count">{questions.length}</span>
            </button>

            {Object.keys(subjectsMap).map((name) => {
              const item = subjectsMap[name];
              const isSelected = selectedSubject === name;
              return (
                <button
                  key={name}
                  className={`vault-tab-pill ${isSelected ? "active" : ""}`}
                  onClick={() => setSelectedSubject(name)}
                >
                  <span className="vault-tab-icon">{item.icon}</span>
                  <span className="vault-tab-title">{name}</span>
                  <span className="vault-tab-count">{item.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 1: QUESTIONS BANK */}
      {tab === "questions" && (
        <section className="vault-questions-section">
          {filteredQuestions.length === 0 ? (
            <div className="card vault-empty">
              <HelpCircle size={36} className="muted" />
              <h3>No interview questions match your filter</h3>
              <p className="small muted">
                Generate market interview questions for any subject or topic using the AI generator.
              </p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowGenModal(true)}
                style={{ marginTop: 12 }}
              >
                <Sparkles size={14} /> Generate Questions for {selectedSubject !== "ALL" ? selectedSubject : "Any Subject"}
              </button>
            </div>
          ) : selectedSubject !== "ALL" ? (
            /* GROUPED BY TOPIC VIEW WHEN SPECIFIC SUBJECT SELECTED */
            <div className="vault-topics-container">
              {Object.keys(groupedByTopic).map((topicTitle) => {
                const group = groupedByTopic[topicTitle];
                return (
                  <div key={topicTitle} className="vault-topic-group card">
                    <div className="vault-topic-header">
                      <div>
                        <span className="eyebrow">TOPIC</span>
                        <h3>{topicTitle}</h3>
                      </div>
                      {group.subjectId && group.topicId && (
                        <Link
                          to={`/subjects/${group.subjectId}/topics/${group.topicId}`}
                          className="btn btn-ghost btn-sm"
                          title="Open full topic study guide & code"
                        >
                          Study Full Topic <ArrowRight size={13} />
                        </Link>
                      )}
                    </div>

                    <div className="vault-qa-list">
                      {group.items.map((qa) => {
                        const isOpen = !!openIndex[qa.globalIndex];
                        return (
                          <div key={qa.globalIndex} className={`vault-qa-card ${isOpen ? "open" : ""}`}>
                            <button
                              className="vault-qa-btn"
                              onClick={() => toggleQuestion(qa.globalIndex)}
                              aria-expanded={isOpen}
                            >
                              <span className="vault-qa-q">{qa.question}</span>
                              <span className="vault-qa-chevron">
                                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </span>
                            </button>

                            {isOpen && (
                              <div className="vault-qa-answer">
                                <div className="vault-ans-tag">Interviewer's Expected Answer:</div>
                                <p>{qa.answer}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* FLAT VIEW FOR 'ALL' SUBJECTS */
            <div className="vault-qa-list">
              {filteredQuestions.map((qa, i) => {
                const isOpen = !!openIndex[i];
                return (
                  <div key={i} className={`vault-qa-card ${isOpen ? "open" : ""}`}>
                    <div className="vault-qa-meta">
                      <span className="badge" style={{ background: "var(--soft)", color: "var(--text)" }}>
                        {qa.subjectIcon || "📚"} {qa.subjectName}
                      </span>
                      <span className="small muted">Topic: {qa.topicTitle}</span>
                      {qa.subjectId && qa.topicId && (
                        <Link
                          to={`/subjects/${qa.subjectId}/topics/${qa.topicId}`}
                          className="vault-goto-link"
                          title="Study full topic"
                        >
                          Study Topic <ArrowRight size={12} />
                        </Link>
                      )}
                    </div>

                    <button
                      className="vault-qa-btn"
                      onClick={() => toggleQuestion(i)}
                      aria-expanded={isOpen}
                    >
                      <span className="vault-qa-q">{qa.question}</span>
                      <span className="vault-qa-chevron">
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="vault-qa-answer">
                        <div className="vault-ans-tag">Interviewer's Expected Answer:</div>
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

      {/* TAB 2: MY REVISION NOTES */}
      {tab === "notes" && (
        <section className="vault-notes-section">
          {filteredNotes.length === 0 ? (
            <div className="card vault-empty">
              <Edit3 size={32} className="muted" />
              <h3>No personal notes yet</h3>
              <p className="small muted">
                Go to any topic, jot down notes in the "My Personal Notes" tab, and they will automatically save to your MongoDB cloud and show up here.
              </p>
              <Link to="/subjects" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
                Browse Subjects
              </Link>
            </div>
          ) : (
            <div className="vault-notes-grid">
              {filteredNotes.map((note) => (
                <div key={note._id} className="card vault-note-card">
                  <div className="vault-note-head">
                    <span className="badge ai">
                      {note.subject?.icon || "📝"} {note.subject?.name || "Topic"}
                    </span>
                    {note.subject?._id && note.topicId && (
                      <Link
                        to={`/subjects/${note.subject._id}/topics/${note.topicId}`}
                        className="btn btn-ghost btn-sm"
                      >
                        Open Topic <ArrowRight size={13} />
                      </Link>
                    )}
                  </div>
                  <div className="vault-note-body">
                    <p>{note.content}</p>
                  </div>
                  <div className="vault-note-foot">
                    <Clock size={12} />
                    <span>Saved in cloud • {new Date(note.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* MODAL: GENERATE MARKET QUESTIONS */}
      {showGenModal && (
        <div className="modal-backdrop" onClick={() => !genBusy && setShowGenModal(false)}>
          <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Sparkles size={20} className="badge-icon" />
                <h3>Generate Market Interview Questions</h3>
              </div>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setShowGenModal(false)}
                disabled={genBusy}
              >
                <X size={18} />
              </button>
            </div>

            <p className="muted small" style={{ marginBottom: 16 }}>
              AI extracts high-yield, interview-tested questions asked by Tier-1 product companies and hiring bar raisers, paired with comprehensive expected answers.
            </p>

            {genSuccess && <div className="alert alert-success">{genSuccess}</div>}

            <form onSubmit={handleGenerateMarketQuestions} className="modal-form">
              <div className="form-group">
                <label>
                  <strong>Subject</strong>
                </label>
                <select
                  value={genSubject}
                  onChange={(e) => setGenSubject(e.target.value)}
                  disabled={genBusy}
                >
                  {subjectsList.map((s) => (
                    <option key={s._id} value={s.name}>
                      {s.icon} {s.name}
                    </option>
                  ))}
                  <option value="__custom__">➕ Other / Custom Subject...</option>
                </select>
              </div>

              {genSubject === "__custom__" && (
                <div className="form-group">
                  <label>
                    <strong>Custom Subject Name</strong>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kubernetes, Golang, System Design, Kafka, Spring Boot..."
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    required
                    disabled={genBusy}
                  />
                </div>
              )}

              <div className="form-group">
                <label>
                  <strong>Specific Topic / Area (Optional)</strong>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Concurrency & Goroutines, B-Trees & Indexing, Memory Leaks..."
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  disabled={genBusy}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label>
                    <strong>Target Role</strong>
                  </label>
                  <select
                    value={genRole}
                    onChange={(e) => setGenRole(e.target.value)}
                    disabled={genBusy}
                  >
                    <option value="SDE-1 (Junior / Campus Placement)">SDE-1 (Junior / Campus)</option>
                    <option value="SDE-2 (Mid-Level Developer)">SDE-2 (Mid-Level)</option>
                    <option value="Senior Staff Software Engineer">Senior / Staff Engineer</option>
                    <option value="Fullstack Web Developer">Fullstack Web Developer</option>
                    <option value="Backend Specialist & Distributed Systems">Backend & Distributed Systems</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    <strong>Target Company Tier</strong>
                  </label>
                  <select
                    value={genCompany}
                    onChange={(e) => setGenCompany(e.target.value)}
                    disabled={genBusy}
                  >
                    <option value="FAANG / Top Tier-1 Tech (Google, Amazon, Meta, Microsoft)">
                      FAANG / Tier-1 Tech
                    </option>
                    <option value="High-Growth Unicorn Startups">High-Growth Startups</option>
                    <option value="Fintech & High-Frequency Trading">Fintech & High-Frequency</option>
                    <option value="General Product & Service Companies">Product & IT Services</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>
                  <strong>Number of Questions: {genCount}</strong>
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[5, 10, 15].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      className={`btn btn-sm ${genCount === cnt ? "btn-primary" : "btn-ghost"}`}
                      onClick={() => setGenCount(cnt)}
                      disabled={genBusy}
                    >
                      {cnt} Questions
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowGenModal(false)}
                  disabled={genBusy}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={genBusy}>
                  {genBusy ? (
                    <>
                      <Spinner /> Researching & Generating…
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} /> Generate & Save Questions
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
