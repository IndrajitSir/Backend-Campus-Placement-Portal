import { body } from "express-validator";

export const registerValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage("Name must be 2-60 characters")
    .matches(/^[a-zA-Z\s.'-]+$/)
    .withMessage("Name contains invalid characters"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6, max: 128 })
    .withMessage("Password must be 6-128 characters"),
  body("role")
    .optional()
    .isIn(["student", "placement_staff", "admin", "super_admin"])
    .withMessage("Role must be one of: student, placement_staff, admin, super_admin"),
];

export const loginValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

export const registerAdminValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage("Name must be 2-60 characters")
    .matches(/^[a-zA-Z\s.'-]+$/)
    .withMessage("Name contains invalid characters"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6, max: 128 })
    .withMessage("Password must be 6-128 characters"),
  body("phone")
    .trim()
    .isLength({ min: 7, max: 15 })
    .withMessage("Phone number must be 7-15 characters")
    .matches(/^[+]?[\d\s()-]+$/)
    .withMessage("Phone number contains invalid characters"),
];
