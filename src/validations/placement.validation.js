import { body, param } from "express-validator";

const objectIdParam = param("id")
  .isLength({ min: 24, max: 24 })
  .withMessage("Invalid ID format")
  .isHexadecimal()
  .withMessage("ID must be a valid hexadecimal string");

export const createPlacementValidation = [
  body("company_name")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Company name is required (max 200 characters)"),
  body("job_title")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Job title is required (max 200 characters)"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Description must be under 5000 characters"),
  body("eligibility")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Eligibility must be under 500 characters"),
  body("location")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Location must be under 200 characters"),
  body("last_date")
    .isISO8601()
    .withMessage("Last date must be a valid date (ISO 8601)"),
  body("salary")
    .optional({ values: "null" })
    .isFloat({ min: 0, max: 100000000 })
    .withMessage("Salary must be between 0 and 100,000,000"),
];

export const updatePlacementValidation = [
  objectIdParam,
  body("company_name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Company name must be 1-200 characters"),
  body("job_title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Job title must be 1-200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Description must be under 5000 characters"),
  body("eligibility")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Eligibility must be under 500 characters"),
  body("location")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Location must be under 200 characters"),
  body("last_date")
    .optional()
    .isISO8601()
    .withMessage("Last date must be a valid date (ISO 8601)"),
  body("salary")
    .optional({ values: "null" })
    .isFloat({ min: 0, max: 100000000 })
    .withMessage("Salary must be between 0 and 100,000,000"),
];

export const placementIdValidation = [objectIdParam];

export const updateJobTitleValidation = [
  objectIdParam,
  body("newJobTitle")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Job title is required (max 200 characters)"),
];

export const updateDescriptionValidation = [
  objectIdParam,
  body("newDescription")
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage("Description is required (max 5000 characters)"),
];

export const updateEligibilityValidation = [
  objectIdParam,
  body("newEligibility")
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Eligibility is required (max 500 characters)"),
];

export const updateLocationValidation = [
  objectIdParam,
  body("newLocation")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Location is required (max 200 characters)"),
];

export const updateLastDateValidation = [
  objectIdParam,
  body("newLastDate")
    .isISO8601()
    .withMessage("Last date must be a valid date (ISO 8601)"),
];
