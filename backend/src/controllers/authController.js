const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Otp = require("../models/Otp");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { validateSignup } = require("../utils/validators");
const { currentStreak } = require("../utils/streak");
const emailService = require("../services/emailService");

const makeToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  streak: { current: currentStreak(u), longest: u.streak?.longest || 0 },
  joinedAt: u.createdAt,
});

// Step 1: Request Signup & Send 6-Digit Email OTP
exports.signup = asyncHandler(async (req, res) => {
  const { errors, values } = validateSignup(req.body || {});
  if (Object.keys(errors).length) {
    throw new AppError(400, "Please fix the highlighted fields", errors);
  }

  const existingUser = await User.findOne({ email: values.email });
  if (existingUser) {
    throw new AppError(409, "This email is already registered", {
      email: "This email is already registered. Please login.",
    });
  }

  const hashed = await bcrypt.hash(values.password, 10);
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Clean any old pending OTPs for this email
  await Otp.deleteMany({ email: values.email });

  // Store pending registration with 10-minute expiry
  await Otp.create({
    email: values.email,
    name: values.name,
    passwordHash: hashed,
    otp: otpCode,
  });

  // Send Email with OTP
  const emailRes = await emailService.sendVerificationOtpEmail({
    toEmail: values.email,
    name: values.name,
    otp: otpCode,
  });

  res.status(200).json({
    requiresOtp: true,
    email: values.email,
    message: `A 6-digit verification code has been sent to ${values.email}.`,
    devOtp: emailRes.devOtp, // available for testing if SMTP is not configured
  });
});

// Step 2: Verify OTP & Activate User Account
exports.verifyOtp = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const otp = String(req.body?.otp || "").trim();

  if (!email || !otp) {
    throw new AppError(400, "Email and 6-digit verification code are required");
  }

  const pending = await Otp.findOne({ email, otp });
  if (!pending) {
    throw new AppError(400, "Invalid or expired verification code. Please check and try again.");
  }

  if (await User.exists({ email })) {
    await Otp.deleteMany({ email });
    throw new AppError(409, "This email is already registered. Please log in.");
  }

  // Create active verified user
  const user = await User.create({
    name: pending.name,
    email: pending.email,
    password: pending.passwordHash,
    isVerified: true,
  });

  // Clean OTP records
  await Otp.deleteMany({ email });

  res.status(201).json({
    token: makeToken(user._id),
    user: publicUser(user),
    message: "Email successfully verified! Welcome to DevRecall.",
  });
});

// Resend OTP
exports.resendOtp = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!email) throw new AppError(400, "Email is required");

  const pending = await Otp.findOne({ email });
  if (!pending) {
    throw new AppError(400, "No pending registration found for this email. Please sign up again.");
  }

  const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
  pending.otp = newOtp;
  pending.createdAt = new Date();
  await pending.save();

  const emailRes = await emailService.sendVerificationOtpEmail({
    toEmail: pending.email,
    name: pending.name,
    otp: newOtp,
  });

  res.json({
    message: `A fresh 6-digit verification code has been sent to ${pending.email}.`,
    devOtp: emailRes.devOtp,
  });
});

// Login
exports.login = asyncHandler(async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!email || !password) throw new AppError(400, "Email and password are required");

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError(401, "Invalid email or password");
  }

  if (user.isVerified === false) {
    throw new AppError(403, "Please verify your email before logging in.");
  }

  res.json({ token: makeToken(user._id), user: publicUser(user) });
});

exports.me = asyncHandler(async (req, res) => res.json({ user: publicUser(req.user) }));
