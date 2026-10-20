import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import api, { errMsg } from "../api";
import { useAuth } from "../context/AuthContext";
import { ErrorBox, Loading, ProgressBar, Spinner } from "../components/ui";

const LETTERS = ["A", "B", "C", "D"];

export default function QuizRun() {
  const { id } = useParams();
  const location = useLocation();
  const [quiz, setQuiz] = useState(location.state?.quiz?.quizId === id ? location.state.quiz : null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (location.state?.quiz?.quizId === id) return;
    setQuiz(null);
    api.get(`/quiz/${id}`).then((r) => setQuiz(r.data)).catch((e) => setErr(errMsg(e)));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (err) return <ErrorBox message={err} />;
  if (!quiz) return <Loading text="Loading quiz…" />;
  return quiz.status === "submitted" ? <Result quiz={quiz} /> : <Taking quiz={quiz} onDone={setQuiz} />;
}

function Taking({ quiz, onDone }) {
  const { refreshUser } = useAuth();
  const n = quiz.questions.length;
  const [answers, setAnswers] = useState(() => Array(n).fill(-1));
  const [i, setI] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const q = quiz.questions[i];
  const answered = answers.filter((a) => a !== -1).length;
  const choose = (idx) => setAnswers((a) => a.map((v, k) => (k === i ? idx : v)));

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      const { data } = await api.post(`/quiz/${quiz.quizId}/submit`, { answers });
      onDone(data);
      refreshUser();
      window.scrollTo(0, 0);
    } catch (e) {
      setErr(errMsg(e));
      setBusy(false);
    }
  };

  return (
    <div className="quiz-wrap">
      <div className="quiz-head">
        <div>
          <span className="eyebrow">{quiz.subjectName}</span>
          <h1>{quiz.topicTitle || "Full subject quiz"}</h1>
        </div>
        <span className="muted small">Question {i + 1} of {n}</span>
      </div>
      <ProgressBar value={i + 1} max={n} />

      <section className="card question">
        <h2>{q.question}</h2>
        <div className="options" role="radiogroup" aria-label="Options">
          {q.options.map((o, idx) => (
            <button key={idx} role="radio" aria-checked={answers[i] === idx} className={"option" + (answers[i] === idx ? " selected" : "")} onClick={() => choose(idx)}>
              <span className="letter">{LETTERS[idx]}</span>
              <span>{o}</span>
            </button>
          ))}
        </div>
      </section>

      {err && <ErrorBox message={err} />}

      <div className="quiz-nav">
        <button className="btn btn-ghost" onClick={() => setI(i - 1)} disabled={i === 0}><ChevronLeft size={16} /> Previous</button>
        <div className="dots" aria-hidden="true">
          {answers.map((a, k) => <button key={k} className={"qdot" + (a !== -1 ? " done" : "") + (k === i ? " cur" : "")} onClick={() => setI(k)} tabIndex={-1}>{k + 1}</button>)}
        </div>
        {i < n - 1 ? (
          <button className="btn btn-primary" onClick={() => setI(i + 1)}>Next <ChevronRight size={16} /></button>
        ) : (
          <button className="btn btn-primary" onClick={submit} disabled={busy || answered < n}>
            {busy ? <><Spinner /> Checking…</> : "Submit quiz"}
          </button>
        )}
      </div>
      {i === n - 1 && answered < n && <p className="muted small center-text">Answer all questions to submit ({n - answered} left).</p>}
    </div>
  );
}

function Result({ quiz }) {
  const p = quiz.percent;
  const msg = p === 100 ? "Perfect score! 🎉" : p >= 70 ? "Great job! 👏" : p >= 40 ? "Good effort, revise the missed points." : "Keep going. Review the topic and try again.";
  const R = 52, C = 2 * Math.PI * R;

  return (
    <div className="quiz-wrap">
      <section className="card result-card">
        <svg viewBox="0 0 120 120" className="ring" role="img" aria-label={`Score ${p} percent`}>
          <circle cx="60" cy="60" r={R} className="ring-bg" />
          <circle cx="60" cy="60" r={R} className="ring-fg" strokeDasharray={C} strokeDashoffset={C - (C * p) / 100} transform="rotate(-90 60 60)" />
          <text x="60" y="66" textAnchor="middle" className="ring-text">{p}%</text>
        </svg>
        <div>
          <span className="eyebrow">{quiz.subjectName}{quiz.topicTitle ? ` · ${quiz.topicTitle}` : ""}</span>
          <h1>You scored {quiz.score} / {quiz.total}</h1>
          <p className="muted">{msg}</p>
          <div className="row-gap">
            <Link to="/quiz" className="btn btn-primary btn-sm">Take another quiz</Link>
            <Link to="/progress" className="btn btn-ghost btn-sm">View progress</Link>
          </div>
        </div>
      </section>

      <h3 className="review-title">Review your answers</h3>
      {quiz.results.map((r, idx) => (
        <section key={idx} className={"card review " + (r.isCorrect ? "right" : "wrong")}>
          <div className="review-q"><span className="rq-icon">{r.isCorrect ? <Check size={16} /> : <X size={16} />}</span><strong>{idx + 1}. {r.question}</strong></div>
          <ul className="review-options">
            {r.options.map((o, k) => (
              <li key={k} className={(k === r.correctIndex ? "correct " : "") + (k === r.selected && k !== r.correctIndex ? "picked-wrong" : "")}>
                <span className="letter">{LETTERS[k]}</span><span>{o}</span>
                {k === r.correctIndex && <em>Correct answer</em>}
                {k === r.selected && k !== r.correctIndex && <em>Your answer</em>}
              </li>
            ))}
          </ul>
          {r.explanation && <p className="explain"><b>Why:</b> {r.explanation}</p>}
        </section>
      ))}
    </div>
  );
}
