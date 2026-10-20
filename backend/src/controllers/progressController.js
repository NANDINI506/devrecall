const Progress = require("../models/Progress");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { recordActivity } = require("../utils/streak");
const { findSubject } = require("./subjectController");

// POST /api/progress/toggle  { subjectId, topicId, completed }
exports.toggle = asyncHandler(async (req, res) => {
  const { subjectId, topicId } = req.body || {};
  const completed = req.body?.completed !== false;

  const subject = await findSubject(subjectId);
  const topic = subject.topics.find((t) => String(t._id) === String(topicId));
  if (!topic) throw new AppError(404, "Topic not found");

  await Progress.findOneAndUpdate(
    { user: req.user._id, subject: subject._id, topicId: topic._id },
    { completed, completedAt: completed ? new Date() : null },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  if (completed) await recordActivity(req.user);

  const completedCount = await Progress.countDocuments({ user: req.user._id, subject: subject._id, completed: true });
  res.json({ completed, completedCount, topicCount: subject.topics.length });
});
