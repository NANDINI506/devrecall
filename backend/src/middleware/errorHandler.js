// Turns every error into a clean JSON response: { message, errors? }
exports.notFound = (req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });

// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  if (err.status) return res.status(err.status).json({ message: err.message, errors: err.errors });
  if (err.name === "CastError") return res.status(400).json({ message: "Invalid id" });
  if (err.code === 11000) return res.status(409).json({ message: "Already exists" });
  if (err.type === "entity.parse.failed") return res.status(400).json({ message: "Invalid JSON body" });
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Something went wrong on the server" });
};
