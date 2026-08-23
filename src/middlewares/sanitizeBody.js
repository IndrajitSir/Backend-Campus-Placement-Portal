/**
 * Sanitize request body — strip potentially dangerous fields that users
 * should never set (role escalation, ownership override, etc.).
 *
 * Place this after body-parser and before controllers.
 */
const FORBIDDEN_BODY_FIELDS = [
  "role",
  "isAdmin",
  "permissions",
  "isSuperAdmin",
  "googleId",
  "githubId",
  "refreshToken",
  "created_by",
];

export const sanitizeBody = (req, _res, next) => {
  if (req.body && typeof req.body === "object") {
    for (const field of FORBIDDEN_BODY_FIELDS) {
      if (field in req.body) {
        delete req.body[field];
      }
    }
  }
  next();
};
