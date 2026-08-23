import { body, param } from "express-validator";

export const sendMessageValidation = [
  body("senderId")
    .trim()
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid sender ID format")
    .isHexadecimal()
    .withMessage("Sender ID must be a valid hexadecimal string"),
  body("receiverId")
    .trim()
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid receiver ID format")
    .isHexadecimal()
    .withMessage("Receiver ID must be a valid hexadecimal string"),
  body("text")
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage("Message text is required (max 10000 characters)"),
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
