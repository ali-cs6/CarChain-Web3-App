// This file defines a custom error class that extends the built-in Error. standardized way to handle errors in an API context, allowing developers to include additional information such as status codes, error messages, and stack traces when throwing errors.
class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = "",
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;
    this.message = message;

    if (stack) { // If a stack trace is provided, use it; otherwise, capture the current stack trace
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = ApiError;