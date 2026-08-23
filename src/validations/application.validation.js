import { body, param } from "express-validator";

export const applyForPlacementValidation = [
  param("placementId")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid placement ID format")
    .isHexadecimal()
    .withMessage("Placement ID must be a valid hexadecimal string"),
];

export const updateStatusValidation = [
  body("newStatus")
    .isIn(["shortlisted", "selected", "rejected"])
    .withMessage("Status must be one of: shortlisted, selected, rejected"),
  body("recordID")
    .trim()
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid record ID format")
    .isHexadecimal()
    .withMessage("Record ID must be a valid hexadecimal string"),
];

export const deleteApplicationValidation = [
  body("recordID")
    .trim()
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid record ID format")
    .isHexadecimal()
    .withMessage("Record ID must be a valid hexadecimal string"),
];
