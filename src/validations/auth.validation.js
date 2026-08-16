import Joi from "joi";

const name = Joi.string().trim().min(2).max(60).required().messages({
  "string.empty": "Name is required",
  "string.min": "Name must be at least 2 characters long",
  "any.required": "Name is required",
});

const email = Joi.string().trim().lowercase().email().required().messages({
  "string.empty": "Email is required",
  "string.email": "Please provide a valid email address",
  "any.required": "Email is required",
});

const password = Joi.string().min(6).max(128).required().messages({
  "string.empty": "Password is required",
  "string.min": "Password must be at least 6 characters long",
  "any.required": "Password is required",
});

export const registerSchema = Joi.object({
  name,
  email,
  password,
  role: Joi.string()
    .valid("student", "placement_staff", "admin", "super_admin")
    .default("student")
    .messages({
      "any.only": "Role must be one of: student, placement_staff, admin, super_admin",
    }),
});

export const loginSchema = Joi.object({
  email,
  password: Joi.string().required().messages({
    "string.empty": "Password is required",
    "any.required": "Password is required",
  }),
});

export const registerAdminSchema = Joi.object({
  name,
  email,
  password,
  phone: Joi.string().trim().min(7).max(15).required().messages({
    "string.empty": "Phone number is required",
    "any.required": "Phone number is required",
  }),
});
