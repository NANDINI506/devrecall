import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  Bot,
  Send,
  Trash2,
  User,
  Plus,
  MessageSquare,
  Clock,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Menu,
  X,
} from "lucide-react";
import api, { errMsg } from "../api";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "../components/ui";

const GENERAL_SUGGESTIONS = [
  "Explain the difference between a process and a thread in OS",
  "How does JavaScript Event Loop handle microtasks vs macrotasks?",
  "What is Big-O notation? Explain with practical code examples",
  "Top 5 DBMS indexing & normalization interview questions with answers",
];

export default function Chat() {
  const { user, refreshUser } = useAuth();
  const [params, setParams] = useSearchParams();
  const subjectId = params.get("subject") || "";
  const topicId = params.get("topic") || "";

  // Thread management
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [activeTitle, setActiveTitle] = useState("New Chat");
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [showMobileHistory, setShowMobileHistory] = useState(false);

  // Messages in current thread
  const [messages, setMessages] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topicTitle, setTopicTitle] = useState("");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  // Load subject list
  useEffect(() => {
    api.get("/subjects").then((r) => setSubjects(r.data)).catch(() => {});
  }, []);

  // Load topic info if query params present
  useEffect(() => {
    if (subjectId && topicId) {
      api
        .get(`/subjects/${subjectId}/topics/${topicId}`)
        .then((r) => setTopicTitle(r.data.topic.title))
        .catch(() => setTopicTitle(""));
    } else {
      setTopicTitle("");
    }
  }, [subjectId, topicId]);

  // Load chat threads from MongoDB
  const fetchThreads = async () => {
    try {
      setLoadingThreads(true);
      const { data } = await api.get("/chat/threads");
      setThreads(data);
      return data;
    } catch {
      return [];
    } finally {
      setLoadingThreads(false);
    }
  };

  useEffect(() => {
    fetchThreads().then((loaded) => {
      const threadParam = params.get("thread");
      if (threadParam && loaded.some((t) => t._id === threadParam)) {
        selectThread(threadParam, false);
      } else {
        startNewChat(false);
      }
    });
  }, []);

  // Select a thread to view
  const selectThread = async (threadId, updateUrl = true) => {
    if (!threadId) {
      startNewChat();
      return;
    }
    setActiveThreadId(threadId);
    setShowMobileHistory(false);
    if (updateUrl) {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("thread", threadId);
        return next;
      });
    }
    try {
      const { data } = await api.get(`/chat/threads/${threadId}`);
      setMessages(data.messages || []);
      setActiveTitle(data.title || "Chat");
      if (data.subject) {
        setParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set("subject", data.subject);
          return next;
        });
      }
    } catch (e) {
      console.error("Could not load thread:", e);
    }
  };

  // Start a fresh new chat session
  const startNewChat = (updateUrl = true) => {
    setActiveThreadId(null);
    setMessages([]);
    setActiveTitle("New Chat");
    setInput("");
    setShowMobileHistory(false);
    if (updateUrl) {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("thread");
        return next;
      });
    }
  };

  // Delete a specific thread
  const deleteThread = async (e, threadId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this conversation?")) return;
    try {
      await api.delete(`/chat/threads/${threadId}`);
      setThreads((prev) => prev.filter((t) => t._id !== threadId));
      if (activeThreadId === threadId) {
        startNewChat();
      }
    } catch (err) {
      alert("Failed to delete chat: " + errMsg(err));
    }
  };

  // Clear all threads
  const clearAllChats = async () => {
    if (!window.confirm("Are you sure you want to delete all saved conversations?")) return;
    try {
      await api.delete("/chat/threads");
      setThreads([]);
      startNewChat();
    } catch (err) {
      alert("Failed to clear chats: " + errMsg(err));
    }
  };

  // Auto-scroll when messages change
  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  const subject = subjects.find((s) => s._id === subjectId);
  const suggestions = subject
    ? [
        `Explain the most important interview concepts of ${subject.name}`,
        `Give me 5 frequently asked interview coding questions on ${subject.name}`,
        `What are common pitfalls and traps developers fall into in ${subject.name}?`,
      ]
    : GENERAL_SUGGESTIONS;

  // Send message
  const send = async (text) => {
    const q = (text ?? input).trim();
    if (!q || busy) return;

    // Optimistically add user message
    const tempUserMsg = { role: "user", content: q };
    setMessages((prev) => [...prev, tempUserMsg]);
    setInput("");
    setBusy(true);

    try {
      const { data } = await api.post("/chat", {
        message: q,
        conversationId: activeThreadId || undefined,
        subjectId: subjectId || undefined,
        topicId: topicId || undefined,
      });

      // Update thread ID and title if this was a new thread
      if (!activeThreadId && data.conversationId) {
        setActiveThreadId(data.conversationId);
        setActiveTitle(data.title);
      }

      // Sync backend message list (has IDs and timestamps)
      if (data.messages) {
        setMessages(data.messages);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      }

      // Refresh thread sidebar
      fetchThreads();
      refreshUser();
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: errMsg(e), error: true },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const formatThreadDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <div className="chat-layout-root">
      {/* Top action header */}
      <div className="chat-header-bar">
        <div className="ch-title-wrap">
          <button
            className="btn btn-ghost btn-sm mobile-history-btn"
            onClick={() => setShowMobileHistory(!showMobileHistory)}
            aria-label="Toggle chat history"
          >
            {showMobileHistory ? <X size={16} /> : <Menu size={16} />}
            <span>History</span>
          </button>
          <h2>{activeTitle || "AI Tutor"}</h2>
          {topicTitle && <span className="badge ai">Topic: {topicTitle}</span>}
        </div>

        <div className="ch-context-wrap">
          <label htmlFor="ctx">Studying:</label>
          <select
            id="ctx"
            value={subjectId}
            onChange={(e) => setParams(e.target.value ? { subject: e.target.value } : {})}
          >
            <option value="">General (Any Topic)</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.icon} {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="chat-main-grid">
        {/* Left ChatGPT-style History Sidebar */}
        <aside className={`chat-history-sidebar ${showMobileHistory ? "open" : ""}`}>
          <div className="chs-top">
            <button className="btn btn-primary btn-block new-chat-btn" onClick={startNewChat}>
              <Plus size={16} />
              <span>New Chat</span>
            </button>
          </div>

          <div className="chs-header">
            <span>SAVED CONVERSATIONS</span>
            {threads.length > 0 && (
              <button
                className="chs-clear-all"
                onClick={clearAllChats}
                title="Delete all chat history"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="chs-list">
            {loadingThreads ? (
              <div className="chs-loading">
                <Spinner size={16} />
                <span>Loading history…</span>
              </div>
            ) : threads.length === 0 ? (
              <div className="chs-empty">
                <MessageSquare size={24} className="muted" />
                <p>No saved chats yet.</p>
                <span className="small muted">Ask a doubt to start your first session.</span>
              </div>
            ) : (
              threads.map((t) => (
                <div
                  key={t._id}
                  className={`chs-item ${activeThreadId === t._id ? "active" : ""}`}
                  onClick={() => selectThread(t._id)}
                >
                  <div className="chs-item-icon">
                    <MessageSquare size={15} />
                  </div>
                  <div className="chs-item-content">
                    <span className="chs-item-title">{t.title}</span>
                    <span className="chs-item-meta">
                      <Clock size={11} />
                      {formatThreadDate(t.updatedAt)} • {t.messageCount} msg
                    </span>
                  </div>
                  <button
                    className="chs-item-del"
                    onClick={(e) => deleteThread(e, t._id)}
                    title="Delete conversation"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Right Active Chat Box */}
        <section className="chat-viewport">
          <div className="chat-scroll" aria-live="polite">
            {messages.length === 0 ? (
              <div className="chat-empty">
                <div className="bot-badge">
                  <Bot size={28} />
                </div>
                <h3>What would you like to master today?</h3>
                <p className="muted small">
                  Ask any interview question, architecture doubt, or code clarification in English or Hinglish.
                </p>
                <div className="chips center">
                  {suggestions.map((s) => (
                    <button key={s} className="chip" onClick={() => send(s)}>
                      <Sparkles size={13} />
                      <span>{s}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={"msg " + m.role + (m.error ? " error" : "")}>
                  <div className="msg-avatar">
                    {m.role === "user" ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className="msg-body">
                    {m.error && (
                      <div className="msg-error-tag">
                        <AlertCircle size={14} />
                        <strong>Error</strong>
                      </div>
                    )}
                    {m.role === "assistant" ? (
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    ) : (
                      <p>{m.content}</p>
                    )}
                  </div>
                </div>
              ))
            )}

            {busy && (
              <div className="msg assistant">
                <div className="msg-avatar">
                  <Bot size={16} />
                </div>
                <div className="msg-body typing">
                  <Spinner size={16} />
                  <span>DevRecall AI is thinking…</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Prompt input */}
          <div className="chat-input-row">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              rows={1}
              placeholder="Ask a doubt or paste code… (Enter to send, Shift+Enter for new line)"
              maxLength={1500}
              aria-label="Your doubt"
            />
            <button
              className="btn btn-primary btn-icon send-btn"
              onClick={() => send()}
              disabled={busy || !input.trim()}
              aria-label="Send"
            >
              <Send size={18} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
