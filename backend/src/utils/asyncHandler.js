// Wraps async route handlers so any thrown error goes to the global error handler.
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
