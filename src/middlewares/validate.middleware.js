import { ApiError } from "../utils/ApiError.js";

/**
 * Validates req.body against a Joi schema.
 * Throws a 400 ApiError with the first validation message on failure.
 */
export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: true,
    stripUnknown: true,
  });

  if (error) {
    const message = error.details?.[0]?.message?.replace(/"/g, "") || "Invalid request body";
    return next(new ApiError(400, message));
  }

  req.body = value;
  next();
};
