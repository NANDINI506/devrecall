const mongoose = require("mongoose");
const Note = require("../models/Note");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

// GET /api/notes/:subjectId/:topicId -> get note for a specific topic
exports.getNote = asyncHandler(async (req, res) => {
  const { subjectId, topicId } = req.params;
  if (!mongoose.isValidObjectId(subjectId)) throw new AppError(400, "Invalid subject ID");

  const note = await Note.findOne({
    user: req.user._id,
    subject: subjectId,
    topicId,
  });

  res.json({ content: note ? note.content : "", updatedAt: note ? note.updatedAt : null });
});

// POST /api/notes -> create or update note for a specific topic
exports.saveNote = asyncHandler(async (req, res) => {
  const { subjectId, topicId, content } = req.body;
  if (!subjectId || !topicId) throw new AppError(400, "Subject ID and Topic ID are required");
  if (!mongoose.isValidObjectId(subjectId)) throw new AppError(400, "Invalid subject ID");

  const note = await Note.findOneAndUpdate(
    { user: req.user._id, subject: subjectId, topicId },
    { content: typeof content === "string" ? content : "", updatedAt: new Date() },
    { new: true, upsert: true }
  );

  res.json({ message: "Note saved successfully", note });
});

// GET /api/notes -> list all notes of user for interview review
exports.listAllNotes = asyncHandler(async (req, res) => {
  const notes = await Note.find({ user: req.user._id, content: { $ne: "" } })
    .populate("subject", "name icon color")
    .sort({ updatedAt: -1 });

  res.json(notes);
});
