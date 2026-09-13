import { body, param } from "express-validator";

export const sendMessageValidation = [
  body("receiverId")
    .trim()
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid receiver ID format")
    .isHexadecimal()
    .withMessage("Receiver ID must be a valid hexadecimal string"),
  // E2EE sends carry `ciphertexts` instead of plaintext `text`. Require one
  // of the two: text (legacy) or a complete pair of ciphertext envelopes.
  body("text")
    .optional()
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage("Message text must be 1-10000 characters"),
  body("ciphertexts")
    .optional()
    .custom((value, { req }) => {
      if (req.body?.text && req.body.text.trim().length > 0) return true;
      if (!value || typeof value !== "object") {
        throw new Error("Provide either message text or ciphertexts");
      }
      const valid = (env) =>
        env && typeof env.iv === "string" && env.iv.length > 0 &&
        typeof env.salt === "string" && env.salt.length > 0 &&
        typeof env.data === "string" && env.data.length > 0;
      if (!valid(value.toSender) || !valid(value.toReceiver)) {
        throw new Error("ciphertexts must include valid toSender and toReceiver envelopes");
      }
      return true;
    }),
];

export const getConversationValidation = [
  param("senderId")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid sender ID format")
    .isHexadecimal()
    .withMessage("Sender ID must be a valid hexadecimal string"),
  param("receiverId")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid receiver ID format")
    .isHexadecimal()
    .withMessage("Receiver ID must be a valid hexadecimal string"),
];

export const getConversationsValidation = [
  param("userId")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid user ID format")
    .isHexadecimal()
    .withMessage("User ID must be a valid hexadecimal string"),
];
