const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    topicId: { type: String, required: true },
    content: { type: String, default: "" },
  },
  { timestamps: true }
);

noteSchema.index({ user: 1, subject: 1, topicId: 1 }, { unique: true });

module.exports = mongoose.model("Note", noteSchema);
