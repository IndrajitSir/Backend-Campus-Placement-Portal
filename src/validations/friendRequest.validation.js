import { body, param } from "express-validator";

export const sendFriendRequestValidation = [
  body("receiverId")
    .trim()
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid receiver ID format")
    .isHexadecimal()
    .withMessage("Receiver ID must be a valid hexadecimal string"),
];

export const respondToFriendRequestValidation = [
  body("requestId")
    .trim()
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid request ID format")
    .isHexadecimal()
    .withMessage("Request ID must be a valid hexadecimal string"),
  body("action")
    .isIn(["accepted", "rejected"])
    .withMessage("Action must be 'accepted' or 'rejected'"),
];
