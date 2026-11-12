const env = require("../config/env");

function errorHandler(err, req, res, next) {
  console.error("Application Error:", err);

  const statusCode = err.statusCode || 500;

  const response = {
    success: false,
    message:
      env.NODE_ENV === "production" && statusCode >= 500
        ? "Internal server error"
        : err.message || "Something went wrong",
  };

  // Include stack trace only during development
  if (env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;