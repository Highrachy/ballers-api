// eslint-disable-next-line no-unused-vars
export const errorMiddleware = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Server Error';
  const error = err.error || message;

  return res.status(statusCode).json({ success: false, message, error });
};
export class ErrorHandler extends Error {
  constructor(statusCode, message, error = message) {
    super();
    this.statusCode = statusCode;
    this.message = message;
    this.error =
      error instanceof TypeError
        ? {
            columnNumber: error.columnNumber,
            fileName: error.fileName,
            lineNumber: error.lineNumber,
            message: error.message,
            name: error.name,
            stack: error.stack,
          }
        : error;
  }
}
