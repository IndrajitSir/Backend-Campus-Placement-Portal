import { body, param } from "express-validator";

export const changePasswordValidation = [
  body("oldPassword")
    .notEmpty()
    .withMessage("Old password is required"),
  body("newPassword")
    .isLength({ min: 6, max: 128 })
    .withMessage("New password must be 6-128 characters"),
];

export const updateAccountValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage("Name must be 2-60 characters"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("phone")
    .trim()
    .isLength({ min: 7, max: 15 })
    .withMessage("Phone number must be 7-15 characters"),
];

export const updateNameValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage("Name must be 2-60 characters"),
];

export const updateEmailValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
];

export const updatePhoneValidation = [
  body("phone")
    .trim()
    .isLength({ min: 7, max: 15 })
    .withMessage("Phone number must be 7-15 characters")
    .matches(/^[+]?[\d\s()-]+$/)
    .withMessage("Phone number contains invalid characters"),
];

export const getUserByIdValidation = [
  param("userId")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid user ID format")
    .isHexadecimal()
    .withMessage("User ID must be a valid hexadecimal string"),
];
