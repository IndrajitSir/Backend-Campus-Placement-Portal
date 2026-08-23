import rateLimit from "express-rate-limit";

/**
 * General API rate limiter — 100 requests per minute per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, statusCode: 429, message: "Too many requests, please try again later." },
});

/**
 * Strict limiter for auth endpoints — 15 attempts per 15 minutes per IP.
 * Prevents brute-force login and credential stuffing.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, statusCode: 429, message: "Too many authentication attempts, please try again later." },
});

/**
 * Placement creation limiter — 20 per 10 minutes per authenticated user.
 */
export const placementLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, statusCode: 429, message: "Too many placement requests, slow down." },

});
