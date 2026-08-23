import { ApiError } from "../utils/ApiError.js";
import logger from "../utils/Logger/logger.js";

/**
 * 404 handler for unmatched routes.
 */
export const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Centralized error handler.
 * Every error thrown via next(err) or thrown inside asyncHandler lands here,
 * so API responses stay consistent: { success, message, statusCode }.
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err?.statusCode || 500;
  let message = err?.message || "Internal Server Error";

  // Mongoose: invalid ObjectId
  if (err?.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose: validation failure
  if (err?.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors || {})
      .map((e) => e.message)
      .join(", ");
  }

  // Mongoose: duplicate key
  if (err?.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err?.keyValue || {})[0] || "field";
    message = `A record with that ${field} already exists`;
  }

  // JWT errors
  if (err?.name === "JsonWebTokenError" || err?.name === "TokenExpiredError") {
    statusCode = 401;
    message = err?.name === "TokenExpiredError" ? "Session expired, please log in again" : "Invalid authentication token";
  }

  // Unexpected server errors get logged with stack trace
  if (statusCode >= 500) {
    logger.error(`${message} — ${req.method} ${req.originalUrl}`, { stack: err?.stack });
  } else {
    logger.warn(`${message} — ${req.method} ${req.originalUrl}`);
  }

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    data: null,
    // Never expose stack traces or internal paths to the client
    ...(process.env.NODE_ENV !== "production" && err?.stack ? { stack: err.stack } : {}),
  });
};
