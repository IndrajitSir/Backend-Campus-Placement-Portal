import { validationResult } from "express-validator";
import { ApiError } from "../utils/ApiError.js";

/**
 * Process the result of express-validator check chains.
 * Call this as the last middleware in a validation chain array:
 *
 *   router.post("/path", [...validations, validate], controller)
 *
 * If validation errors exist, responds with 400 and the first message.
 * Otherwise trims/sanitizes and calls next().
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array()[0]?.msg || "Invalid request";
    return next(new ApiError(400, message));
  }
  next();
};
