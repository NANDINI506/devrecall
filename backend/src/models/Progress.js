const mongoose = require("mongoose");

// One document per (user, topic): has the user completed this topic?
const progressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    topicId: { type: mongoose.Schema.Types.ObjectId, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

progressSchema.index({ user: 1, subject: 1, topicId: 1 }, { unique: true });

module.exports = mongoose.model("Progress", progressSchema);
