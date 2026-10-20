// An error that carries an HTTP status code, so controllers can simply `throw new AppError(404, "Not found")`.
class AppError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors; // optional field-wise errors for forms
  }
}
module.exports = AppError;
