import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ListChecks, ShieldCheck, Zap } from "lucide-react";
import api, { errMsg } from "../api";
import { ErrorBox, Loading, PageHeader, Spinner } from "../components/ui";

export default function QuizStart() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState(null);
  const [subjectId, setSubjectId] = useState("");
  const [topics, setTopics] = useState([]);
  const [topicId, setTopicId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get("/subjects").then((r) => { setSubjects(r.data); setSubjectId(r.data[0]?._id || ""); }).catch((e) => setErr(errMsg(e)));
  }, []);

  useEffect(() => {
    setTopicId("");
    if (!subjectId) return;
    api.get(`/subjects/${subjectId}`).then((r) => setTopics(r.data.topics)).catch(() => setTopics([]));
  }, [subjectId]);

  const start = async () => {
    setBusy(true);
    setErr("");
    try {
      const { data } = await api.post("/quiz/generate", { subjectId, topicId: topicId || undefined });
      navigate(`/quiz/${data.quizId}`, { state: { quiz: data } });
    } catch (e) {
      setErr(errMsg(e));
      setBusy(false);
    }
  };

  if (!subjects && !err) return <Loading />;

  return (
    <>
      <PageHeader title="Quiz" sub="AI prepares fresh questions every time, so you can't just memorise the answers." />
      <div className="two-col">
        <section className="card">
          <h3>Create a quiz</h3>
          <div className="field">
            <label htmlFor="qs">Subject</label>
            <select id="qs" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={busy}>
              {(subjects || []).map((s) => <option key={s._id} value={s._id}>{s.icon} {s.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="qt">Topic</label>
            <select id="qt" value={topicId} onChange={(e) => setTopicId(e.target.value)} disabled={busy}>
              <option value="">Whole subject (8 questions)</option>
              {topics.map((t) => <option key={t._id} value={t._id}>{t.title} (5 questions)</option>)}
            </select>
          </div>
          {err && <ErrorBox message={err} />}
          <button className="btn btn-primary btn-block" onClick={start} disabled={busy || !subjectId}>
            {busy ? <><Spinner /> AI is preparing your questions…</> : "Start quiz"}
          </button>
        </section>

        <section className="card how">
          <h3>How it works</h3>
          <ul className="how-list">
            <li><Zap size={18} /><div><strong>Fresh AI questions</strong><span>Multiple-choice, based on the topic notes.</span></div></li>
            <li><ListChecks size={18} /><div><strong>Instant review</strong><span>See which answers were right and why.</span></div></li>
            <li><ShieldCheck size={18} /><div><strong>Graded on the server</strong><span>Scores are saved to your progress history.</span></div></li>
            <li><CheckCircle2 size={18} /><div><strong>Counts for your streak</strong><span>Finishing a quiz keeps your daily streak alive.</span></div></li>
          </ul>
        </section>
      </div>
    </>
  );
}
