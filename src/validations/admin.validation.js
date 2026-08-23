import { body, param } from "express-validator";

export const createStudentValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage("Name must be 2-60 characters"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6, max: 128 })
    .withMessage("Password must be 6-128 characters"),
  body("phone")
    .optional()
    .trim()
    .isLength({ min: 7, max: 15 })
    .withMessage("Phone number must be 7-15 characters"),
];

export const createStaffValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage("Name must be 2-60 characters"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6, max: 128 })
    .withMessage("Password must be 6-128 characters"),
  body("phone")
    .optional()
    .trim()
    .isLength({ min: 7, max: 15 })
    .withMessage("Phone number must be 7-15 characters"),
];

export const deleteUserValidation = [
  body("userID")
    .trim()
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid user ID format")
    .isHexadecimal()
    .withMessage("User ID must be a valid hexadecimal string"),
];

export const changeApprovalValidation = [
  body("student_id")
    .trim()
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid student ID format")
    .isHexadecimal()
    .withMessage("Student ID must be a valid hexadecimal string"),
];
