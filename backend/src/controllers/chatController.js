const mongoose = require("mongoose");
const Subject = require("../models/Subject");
const Conversation = require("../models/Conversation");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { recordActivity } = require("../utils/streak");
const ai = require("../services/aiService");

// GET /api/chat/threads  -> list all saved conversation threads for this user
exports.listThreads = asyncHandler(async (req, res) => {
  const threads = await Conversation.find({ user: req.user._id })
    .sort({ updatedAt: -1 })
    .select("title subject topicTitle updatedAt createdAt messages")
    .lean();

  const formatted = threads.map((t) => ({
    _id: t._id,
    title: t.title,
    topicTitle: t.topicTitle,
    updatedAt: t.updatedAt,
    createdAt: t.createdAt,
    messageCount: t.messages?.length || 0,
    lastMessage: t.messages?.length ? t.messages[t.messages.length - 1].content.slice(0, 70) : "",
  }));

  res.json(formatted);
});

// GET /api/chat/threads/:id  -> get single conversation with all messages
exports.getThread = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new AppError(404, "Chat thread not found");
  const thread = await Conversation.findOne({ _id: req.params.id, user: req.user._id });
  if (!thread) throw new AppError(404, "Chat thread not found");
  res.json(thread);
});

// DELETE /api/chat/threads/:id  -> delete single conversation
exports.deleteThread = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new AppError(404, "Chat thread not found");
  const thread = await Conversation.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!thread) throw new AppError(404, "Chat thread not found");
  res.json({ message: "Conversation deleted" });
});

// DELETE /api/chat/threads  -> delete all conversations for this user
exports.clearAllThreads = asyncHandler(async (req, res) => {
  await Conversation.deleteMany({ user: req.user._id });
  res.json({ message: "All conversations cleared" });
});

// POST /api/chat  { message, conversationId?, subjectId?, topicId? }
exports.chat = asyncHandler(async (req, res) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message) throw new AppError(400, "Type a question first");
  if (message.length > 1500) throw new AppError(400, "Question is too long (max 1500 characters)");

  let subject = null, topic = null, topicTitle = "";
  const { subjectId, topicId, conversationId } = req.body;

  if (subjectId && mongoose.isValidObjectId(subjectId)) {
    subject = await Subject.findById(subjectId);
    if (subject && topicId) {
      topic = subject.topics.find((t) => String(t._id) === String(topicId)) || null;
      if (topic) topicTitle = topic.title;
    }
  }

  // Find or create conversation thread
  let conversation = null;
  if (conversationId && mongoose.isValidObjectId(conversationId)) {
    conversation = await Conversation.findOne({ _id: conversationId, user: req.user._id });
  }

  if (!conversation) {
    // Generate a clean conversation title from the first message
    const cleanTitle = message.replace(/[#*`_~]/g, "").trim();
    const title = cleanTitle.length > 38 ? cleanTitle.slice(0, 38).trim() + "…" : cleanTitle;

    conversation = new Conversation({
      user: req.user._id,
      title: title || "New Chat",
      subject: subject?._id || null,
      topicId: topic?._id || null,
      topicTitle,
      messages: [],
    });
  }

  // Append user message
  conversation.messages.push({ role: "user", content: message });

  // Build past messages for context
  const history = conversation.messages
    .slice(-10)
    .filter((m) => !m.error)
    .map((m) => ({ role: m.role, content: m.content }));

  // Call AI
  const reply = await ai.chatReply({ message, history, subject, topic });

  // Append assistant message and persist
  conversation.messages.push({ role: "assistant", content: reply });
  await conversation.save();

  await recordActivity(req.user);

  res.json({
    reply,
    conversationId: conversation._id,
    title: conversation.title,
    messages: conversation.messages,
  });
});
