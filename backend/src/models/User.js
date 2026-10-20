const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    isVerified: { type: Boolean, default: true },
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastActive: { type: String, default: null }, // "YYYY-MM-DD"
    },
    activityDates: { type: [String], default: [] }, // days on which the user studied (for the weekly view)
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
