const mongoose = require("mongoose");
const Subject = require("../models/Subject");
const Progress = require("../models/Progress");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { validateSubjectName, slugify } = require("../utils/validators");
const ai = require("../services/aiService");

const COLORS = ["#E8B93D", "#5B9BD5", "#6EA88B", "#B48EE0", "#E07A5F", "#4FB3BF", "#D98BB0"];

async function findSubject(id) {
  if (!mongoose.isValidObjectId(id)) throw new AppError(404, "Subject not found");
  const subject = await Subject.findById(id);
  if (!subject) throw new AppError(404, "Subject not found");
  return subject;
}

const brief = (s, completedCount = 0) => ({
  _id: s._id, name: s.name, slug: s.slug, icon: s.icon, color: s.color, description: s.description,
  isCustom: s.isCustom, topicCount: s.topics.length, completedCount,
});

exports.findSubject = findSubject;

// GET /api/subjects  -> all subjects with this user's progress
exports.list = asyncHandler(async (req, res) => {
  const [subjects, done] = await Promise.all([
    Subject.find().sort({ isCustom: 1, createdAt: 1 }),
    Progress.find({ user: req.user._id, completed: true }).select("subject").lean(),
  ]);
  const counts = {};
  done.forEach((p) => (counts[String(p.subject)] = (counts[String(p.subject)] || 0) + 1));
  res.json(subjects.map((s) => brief(s, counts[String(s._id)] || 0)));
});

// GET /api/subjects/:id  -> one subject with its topic list and completion flags
exports.getOne = asyncHandler(async (req, res) => {
  const s = await findSubject(req.params.id);
  const done = await Progress.find({ user: req.user._id, subject: s._id, completed: true }).select("topicId").lean();
  const doneSet = new Set(done.map((p) => String(p.topicId)));
  res.json({
    ...brief(s, doneSet.size),
    topics: s.topics.map((t) => ({ _id: t._id, title: t.title, summary: t.summary, completed: doneSet.has(String(t._id)) })),
  });
});

// GET /api/subjects/:id/topics/:topicId  -> full topic content
exports.getTopic = asyncHandler(async (req, res) => {
  const s = await findSubject(req.params.id);
  const idx = s.topics.findIndex((t) => String(t._id) === req.params.topicId);
  if (idx === -1) throw new AppError(404, "Topic not found");

  const t = s.topics[idx];
  const prog = await Progress.findOne({ user: req.user._id, subject: s._id, topicId: t._id }).lean();
  res.json({
    subject: { _id: s._id, name: s.name, icon: s.icon, color: s.color },
    topic: {
      _id: t._id,
      title: t.title,
      summary: t.summary,
      keyPoints: t.keyPoints,
      example: t.example?.code ? t.example : null,
      interviewQuestions: Array.isArray(t.interviewQuestions) ? t.interviewQuestions : [],
      references: Array.isArray(t.references) ? t.references : [],
      deepDive: t.deepDive || "",
    },
    completed: !!prog?.completed,
    index: idx,
    total: s.topics.length,
    prevId: idx > 0 ? s.topics[idx - 1]._id : null,
    nextId: idx < s.topics.length - 1 ? s.topics[idx + 1]._id : null,
  });
});

// POST /api/subjects/:id/topics/:topicId/more-questions -> generate 5 more interview questions
exports.generateMoreQuestions = asyncHandler(async (req, res) => {
  const s = await findSubject(req.params.id);
  const t = s.topics.find((topic) => String(topic._id) === req.params.topicId);
  if (!t) throw new AppError(404, "Topic not found");

  const newQuestions = await ai.generateTopicQuestions({
    subjectName: s.name,
    topicTitle: t.title,
    topicSummary: t.summary,
  });

  t.interviewQuestions.push(...newQuestions);
  await s.save();

  res.json({
    interviewQuestions: t.interviewQuestions,
    addedCount: newQuestions.length,
    message: `Generated ${newQuestions.length} new interview questions!`,
  });
});

// POST /api/subjects/:id/topics/:topicId/deep-dive -> generate comprehensive in-depth study guide
exports.generateDeepDive = asyncHandler(async (req, res) => {
  const s = await findSubject(req.params.id);
  const t = s.topics.find((topic) => String(topic._id) === req.params.topicId);
  if (!t) throw new AppError(404, "Topic not found");

  const deepDiveText = await ai.generateTopicDeepDive({
    subjectName: s.name,
    topicTitle: t.title,
    topicSummary: t.summary,
    keyPoints: t.keyPoints,
  });

  t.deepDive = deepDiveText;
  await s.save();

  res.json({
    deepDive: t.deepDive,
    message: "Comprehensive Deep-Dive study guide generated!",
  });
});

// POST /api/subjects/generate  { name, topicCount?, focus?, regenerate? }
exports.generate = asyncHandler(async (req, res) => {
  const name = validateSubjectName(req.body?.name);
  if (!name) throw new AppError(400, "Enter a subject name (2-40 characters, letters/numbers, e.g. Rust, GraphQL, Docker, React)");

  const topicCount = Math.min(Math.max(Number(req.body?.topicCount) || 15, 6), 25);
  const focus = req.body?.focus || "Full Comprehensive Placement Course";
  const shouldRegenerate = req.body?.regenerate === true;

  const slug = slugify(name);
  const existing = await Subject.findOne({ slug });

  if (existing && !shouldRegenerate) {
    return res.json({ subject: brief(existing), existed: true });
  }

  const data = await ai.generateSubject(name, { topicCount, focus });

  if (existing && shouldRegenerate) {
    existing.description = data.description || existing.description;
    existing.icon = data.icon || existing.icon;
    existing.topics = data.topics;
    await existing.save();
    return res.json({ subject: brief(existing), regenerated: true });
  }

  try {
    const created = await Subject.create({
      name: data.name,
      slug,
      icon: data.icon,
      description: data.description,
      topics: data.topics,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      isCustom: true,
      createdBy: req.user._id,
    });
    res.status(201).json({ subject: brief(created), existed: false });
  } catch (e) {
    if (e.code === 11000) return res.json({ subject: brief(await Subject.findOne({ slug })), existed: true });
    throw e;
  }
});

// POST /api/subjects/:id/expand -> generate 5 more advanced topics and append to syllabus
exports.expandSubject = asyncHandler(async (req, res) => {
  const s = await findSubject(req.params.id);
  const count = Math.min(Math.max(Number(req.body?.count) || 5, 2), 10);

  const existingTitles = s.topics.map((t) => t.title);
  const newTopics = await ai.generateAdditionalTopics({
    subjectName: s.name,
    existingTopicTitles: existingTitles,
    count,
  });

  s.topics.push(...newTopics);
  await s.save();

  res.json({
    subject: s,
    addedCount: newTopics.length,
    totalTopics: s.topics.length,
    message: `Added ${newTopics.length} advanced topics to ${s.name}!`,
  });
});

// DELETE /api/subjects/:id  -> remove a custom subject
exports.deleteSubject = asyncHandler(async (req, res) => {
  const s = await findSubject(req.params.id);
  if (!s.isCustom) throw new AppError(403, "Starter subjects cannot be deleted");
  await Promise.all([
    Subject.findByIdAndDelete(s._id),
    Progress.deleteMany({ subject: s._id }),
  ]);
  res.json({ message: "Subject removed successfully" });
});

// GET /api/interview-questions -> get all interview questions across all subjects
exports.getAllQuestions = asyncHandler(async (req, res) => {
  const subjects = await Subject.find({}, "name icon color topics").lean();
  const all = [];
  for (const s of subjects) {
    for (const t of s.topics || []) {
      for (const q of t.interviewQuestions || []) {
        all.push({
          subjectId: s._id,
          subjectName: s.name,
          subjectIcon: s.icon,
          subjectColor: s.color,
          topicId: t._id,
          topicTitle: t.title,
          question: q.question,
          answer: q.answer,
        });
      }
    }
  }
  res.json(all);
});

// POST /api/interview-questions/generate -> generate market-tested questions and save to database
exports.generateMarketQuestions = asyncHandler(async (req, res) => {
  const {
    subjectName = "General CS & System Design",
    topicTitle = "Core & Advanced Concepts",
    role = "Fullstack / Backend SDE",
    company = "Tier-1 Tech Companies",
    difficulty = "Senior / Placement Level",
    count = 5,
  } = req.body || {};

  const cleanSubject = String(subjectName).trim();
  if (!cleanSubject) throw new AppError(400, "Subject name is required");

  const newQuestions = await ai.generateMarketQuestions({
    subjectName: cleanSubject,
    topicTitle: String(topicTitle).trim(),
    role: String(role).trim(),
    company: String(company).trim(),
    difficulty: String(difficulty).trim(),
    count: Math.min(Math.max(Number(count) || 5, 2), 15),
  });

  // Try to find matching subject to save questions permanently
  const slug = slugify(cleanSubject);
  let subject = await Subject.findOne({ slug });

  if (subject) {
    // Look for matching topic or create one
    let targetTopic = subject.topics.find(
      (t) => t.title.toLowerCase() === String(topicTitle).toLowerCase()
    );

    if (!targetTopic) {
      // Find or create "Placement & Market Interview Questions" topic
      targetTopic = subject.topics.find((t) => /market|placement|interview/i.test(t.title));
      if (!targetTopic && subject.topics.length > 0) {
        targetTopic = subject.topics[0];
      }
    }

    if (targetTopic) {
      targetTopic.interviewQuestions = targetTopic.interviewQuestions || [];
      targetTopic.interviewQuestions.push(...newQuestions);
      await subject.save();
    }
  }

  res.json({
    questions: newQuestions,
    savedToSubject: subject ? subject.name : null,
    message: `Generated ${newQuestions.length} real-world market interview questions!`,
  });
});

