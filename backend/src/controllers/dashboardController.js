const Subject = require("../models/Subject");
const Progress = require("../models/Progress");
const Quiz = require("../models/Quiz");
const asyncHandler = require("../utils/asyncHandler");
const { currentStreak, daysAgo } = require("../utils/streak");

const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// GET /api/dashboard  -> everything the dashboard page needs in one call
exports.get = asyncHandler(async (req, res) => {
  const user = req.user;
  const [subjects, done, quizzes] = await Promise.all([
    Subject.find().sort({ isCustom: 1, createdAt: 1 }),
    Progress.find({ user: user._id, completed: true }).lean(),
    Quiz.find({ user: user._id, status: "submitted" }).sort({ submittedAt: -1 }).limit(50),
  ]);

  const doneSet = new Set(done.map((p) => String(p.topicId)));
  const doneBySubject = {};
  done.forEach((p) => (doneBySubject[String(p.subject)] = (doneBySubject[String(p.subject)] || 0) + 1));

  const percentOf = (q) => (q.total ? Math.round((q.score / q.total) * 100) : 0);
  const avgScore = quizzes.length ? Math.round(quizzes.reduce((s, q) => s + percentOf(q), 0) / quizzes.length) : 0;

  // last 7 days (oldest -> today)
  const active = new Set(user.activityDates);
  const week = [6, 5, 4, 3, 2, 1, 0].map((n) => {
    const date = daysAgo(n);
    return { date, label: DAY[new Date(date + "T00:00:00Z").getUTCDay()], active: active.has(date), isToday: n === 0 };
  });

  // "Continue learning": next unfinished topic, starting from the subject the user touched last
  const lastDone = [...done].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0];
  const ordered = lastDone
    ? [...subjects.filter((s) => String(s._id) === String(lastDone.subject)), ...subjects.filter((s) => String(s._id) !== String(lastDone.subject))]
    : subjects;
  let next = null;
  for (const s of ordered) {
    const t = s.topics.find((x) => !doneSet.has(String(x._id)));
    if (t) { next = { subjectId: s._id, subjectName: s.name, icon: s.icon, topicId: t._id, topicTitle: t.title, summary: t.summary }; break; }
  }

  res.json({
    user: { name: user.name },
    streak: { current: currentStreak(user), longest: user.streak.longest },
    stats: {
      topicsCompleted: done.length,
      totalTopics: subjects.reduce((s, x) => s + x.topics.length, 0),
      quizzesTaken: quizzes.length,
      avgScore,
    },
    week,
    next,
    subjects: subjects.map((s) => ({
      _id: s._id, name: s.name, icon: s.icon, color: s.color,
      topicCount: s.topics.length, completedCount: doneBySubject[String(s._id)] || 0,
    })),
    recentQuizzes: quizzes.slice(0, 5).map((q) => ({
      quizId: q._id, subjectName: q.subjectName, topicTitle: q.topicTitle, percent: percentOf(q), score: q.score, total: q.total, submittedAt: q.submittedAt,
    })),
    scoreTrend: quizzes.slice(0, 10).reverse().map((q) => percentOf(q)),
  });
});
