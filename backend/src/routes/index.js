const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { protect } = require("../middleware/auth");
const auth = require("../controllers/authController");
const subjects = require("../controllers/subjectController");
const progress = require("../controllers/progressController");
const quiz = require("../controllers/quizController");
const chat = require("../controllers/chatController");
const dashboard = require("../controllers/dashboardController");
const notes = require("../controllers/noteController");

// Rate limits protect against password guessing and against burning through the AI quota.
const limiter = (minutes, limit, message) =>
  rateLimit({ windowMs: minutes * 60 * 1000, limit, standardHeaders: true, legacyHeaders: false, message: { message } });
const authLimiter = limiter(15, 30, "Too many attempts. Please try again in a few minutes.");
const aiLimiter = limiter(10, 40, "You are using AI too quickly. Please wait a few minutes.");

// Auth & Email OTP Verification
router.post("/auth/signup", authLimiter, auth.signup);
router.post("/auth/verify-otp", authLimiter, auth.verifyOtp);
router.post("/auth/resend-otp", authLimiter, auth.resendOtp);
router.post("/auth/login", authLimiter, auth.login);
router.get("/auth/me", protect, auth.me);

// Everything below needs a logged-in user
router.get("/dashboard", protect, dashboard.get);

router.get("/subjects", protect, subjects.list);
router.post("/subjects/generate", protect, aiLimiter, subjects.generate);
router.delete("/subjects/:id", protect, subjects.deleteSubject);
router.post("/subjects/:id/expand", protect, aiLimiter, subjects.expandSubject);
router.get("/subjects/:id", protect, subjects.getOne);
router.get("/subjects/:id/topics/:topicId", protect, subjects.getTopic);
router.post("/subjects/:id/topics/:topicId/more-questions", protect, aiLimiter, subjects.generateMoreQuestions);
router.post("/subjects/:id/topics/:topicId/deep-dive", protect, aiLimiter, subjects.generateDeepDive);
router.get("/interview-questions", protect, subjects.getAllQuestions);
router.post("/interview-questions/generate", protect, aiLimiter, subjects.generateMarketQuestions);

router.post("/progress/toggle", protect, progress.toggle);

// Personal notes per topic & interview review
router.get("/notes/:subjectId/:topicId", protect, notes.getNote);
router.post("/notes", protect, notes.saveNote);
router.get("/notes", protect, notes.listAllNotes);

router.post("/quiz/generate", protect, aiLimiter, quiz.generate);
router.get("/quiz/history", protect, quiz.history);
router.get("/quiz/:id", protect, quiz.getOne);
router.post("/quiz/:id/submit", protect, quiz.submit);

router.get("/chat/threads", protect, chat.listThreads);
router.get("/chat/threads/:id", protect, chat.getThread);
router.delete("/chat/threads/:id", protect, chat.deleteThread);
router.delete("/chat/threads", protect, chat.clearAllThreads);
router.post("/chat", protect, aiLimiter, chat.chat);

module.exports = router;
