import { body, param } from "express-validator";

export const updateLocationValidation = [
  body("newLocation")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Location is required (max 200 characters)"),
];

export const updateAboutValidation = [
  body("newAbout")
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage("About field is required (max 2000 characters)"),
];

export const updateProfessionalSkillValidation = [
  body("newProfessionalSkill")
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Professional skill is required (max 500 characters)"),
];

export const updateDepartmentValidation = [
  body("newDepartment")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Department is required (max 200 characters)"),
];

export const addProjectValidation = [
  param("student_id")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid student ID format")
    .isHexadecimal()
    .withMessage("Student ID must be a valid hexadecimal string"),
  body("projects")
    .isArray({ min: 1 })
    .withMessage("Projects must be a non-empty array"),
  body("projects.*.title")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Project title is required (max 200 characters)"),
  body("projects.*.description")
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage("Project description is required (max 2000 characters)"),
  body("projects.*.link")
    .trim()
    .isURL()
    .withMessage("Project link must be a valid URL"),
];

export const updateProjectValidation = [
  param("student_id")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid student ID format")
    .isHexadecimal()
    .withMessage("Student ID must be a valid hexadecimal string"),
  body("project_id")
    .trim()
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid project ID format")
    .isHexadecimal()
    .withMessage("Project ID must be a valid hexadecimal string"),
  body("title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Project title must be 1-200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage("Project description must be 1-2000 characters"),
  body("link")
    .optional()
    .trim()
    .isURL()
    .withMessage("Project link must be a valid URL"),
];

export const deleteProjectValidation = [
  param("student_id")
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid student ID format")
    .isHexadecimal()
    .withMessage("Student ID must be a valid hexadecimal string"),
  body("project_id")
    .trim()
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid project ID format")
    .isHexadecimal()
    .withMessage("Project ID must be a valid hexadecimal string"),
];

export const getProjectsValidation = [
  body("student_id")
    .trim()
    .isLength({ min: 24, max: 24 })
    .withMessage("Invalid student ID format")
    .isHexadecimal()
    .withMessage("Student ID must be a valid hexadecimal string"),
];

export const getOneStudentValidation = [
  body("nameOremail")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Name or email is required"),
];
