const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { validateSignup } = require("../utils/validators");
const { currentStreak } = require("../utils/streak");

const makeToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

// What we send to the browser about a user (never the password).
const publicUser = (u) => ({
  id: u._id, name: u.name, email: u.email,
  streak: { current: currentStreak(u), longest: u.streak.longest },
  joinedAt: u.createdAt,
});

exports.signup = asyncHandler(async (req, res) => {
  const { errors, values } = validateSignup(req.body || {});
  if (Object.keys(errors).length) throw new AppError(400, "Please fix the highlighted fields", errors);

  if (await User.exists({ email: values.email }))
    throw new AppError(409, "This email is already registered", { email: "This email is already registered" });

  const hashed = await bcrypt.hash(values.password, 10);
  const user = await User.create({ name: values.name, email: values.email, password: hashed });
  res.status(201).json({ token: makeToken(user._id), user: publicUser(user) });
});

exports.login = asyncHandler(async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!email || !password) throw new AppError(400, "Email and password are required");

  const user = await User.findOne({ email }).select("+password");
  // Same message for "no user" and "wrong password" so attackers cannot discover which emails exist
  if (!user || !(await bcrypt.compare(password, user.password))) throw new AppError(401, "Invalid email or password");

  res.json({ token: makeToken(user._id), user: publicUser(user) });
});

exports.me = asyncHandler(async (req, res) => res.json({ user: publicUser(req.user) }));
