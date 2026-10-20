const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    error: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const conversationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "New Chat", trim: true },
    messages: [messageSchema],
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", default: null },
    topicId: { type: String, default: null },
    topicTitle: { type: String, default: "" },
  },
  { timestamps: true }
);

conversationSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);
