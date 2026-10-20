const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

// Put this before any route that needs a logged-in user.
// The browser sends:  Authorization: Bearer <token>
exports.protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) throw new AppError(401, "Please log in to continue");

  let payload;
  try {
    payload = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
  } catch {
    throw new AppError(401, "Session expired. Please log in again");
  }

  const user = await User.findById(payload.id);
  if (!user) throw new AppError(401, "Account not found. Please log in again");
  req.user = user;
  next();
});
