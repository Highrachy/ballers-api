// eslint-disable-next-line no-unused-vars
export const errorMiddleware = (err, _req, res, _next) =>
  res.status(err.statusCode).json({ success: false, message: err.message, error: err.error });

export class ErrorHandler extends Error {
  constructor(statusCode, message, error = message) {
    super();
    this.statusCode = statusCode;
    this.message = message;
    this.error = error;
  }
}
