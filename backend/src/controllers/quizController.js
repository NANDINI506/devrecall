const mongoose = require("mongoose");
const Quiz = require("../models/Quiz");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { recordActivity } = require("../utils/streak");
const { findSubject } = require("./subjectController");
const ai = require("../services/aiService");

const percent = (q) => (q.total ? Math.round((q.score / q.total) * 100) : 0);

// Never send correct answers to the browser while the quiz is still pending.
const forTaking = (q) => ({
  quizId: q._id, subjectName: q.subjectName, topicTitle: q.topicTitle, status: q.status,
  questions: q.questions.map((x) => ({ question: x.question, options: x.options })),
});

const withResult = (q) => ({
  quizId: q._id, subjectName: q.subjectName, topicTitle: q.topicTitle, status: q.status,
  score: q.score, total: q.total, percent: percent(q), submittedAt: q.submittedAt,
  results: q.questions.map((x, i) => ({
    question: x.question, options: x.options, selected: q.answers[i], correctIndex: x.answerIndex,
    explanation: x.explanation, isCorrect: q.answers[i] === x.answerIndex,
  })),
});

// POST /api/quiz/generate  { subjectId, topicId? }
exports.generate = asyncHandler(async (req, res) => {
  const subject = await findSubject(req.body?.subjectId);
  let topic = null;
  if (req.body?.topicId) {
    topic = subject.topics.find((t) => String(t._id) === String(req.body.topicId));
    if (!topic) throw new AppError(404, "Topic not found");
  }

  const questions = await ai.generateQuiz({ subject, topic });
  const quiz = await Quiz.create({
    user: req.user._id, subject: subject._id, subjectName: subject.name,
    topicId: topic?._id || null, topicTitle: topic?.title || "", questions, total: questions.length,
  });
  res.status(201).json(forTaking(quiz));
});

// GET /api/quiz/history
exports.history = asyncHandler(async (req, res) => {
  const quizzes = await Quiz.find({ user: req.user._id, status: "submitted" }).sort({ submittedAt: -1 }).limit(50);
  res.json(quizzes.map((q) => ({
    quizId: q._id, subjectName: q.subjectName, topicTitle: q.topicTitle,
    score: q.score, total: q.total, percent: percent(q), submittedAt: q.submittedAt,
  })));
});

async function loadQuiz(req) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new AppError(404, "Quiz not found");
  const quiz = await Quiz.findOne({ _id: req.params.id, user: req.user._id });
  if (!quiz) throw new AppError(404, "Quiz not found");
  return quiz;
}

// GET /api/quiz/:id  -> questions if pending, full review if already submitted
exports.getOne = asyncHandler(async (req, res) => {
  const quiz = await loadQuiz(req);
  res.json(quiz.status === "submitted" ? withResult(quiz) : forTaking(quiz));
});

// POST /api/quiz/:id/submit  { answers: [0,2,1,...] }  -> graded on the server
exports.submit = asyncHandler(async (req, res) => {
  const quiz = await loadQuiz(req);
  if (quiz.status === "submitted") return res.json(withResult(quiz));

  const answers = req.body?.answers;
  if (!Array.isArray(answers) || answers.length !== quiz.questions.length || !answers.every((a) => Number.isInteger(a) && a >= -1 && a <= 3))
    throw new AppError(400, "Please send one answer for every question");

  quiz.answers = answers;
  quiz.score = quiz.questions.reduce((s, q, i) => s + (answers[i] === q.answerIndex ? 1 : 0), 0);
  quiz.status = "submitted";
  quiz.submittedAt = new Date();
  await quiz.save();
  await recordActivity(req.user);

  res.json(withResult(quiz));
});
