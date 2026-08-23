import { Router } from 'express';
import { newPlacement, getAllPlacements, deletePlacement, updatePlacement, updateJobTitle, updateDescription, updateEligibility, updateLocation, updateLastDate } from '../controllers/placement.controller.js';
import { verifyUserWithRole } from '../middlewares/verifyUser.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createPlacementValidation,
  updatePlacementValidation,
  placementIdValidation,
  updateJobTitleValidation,
  updateDescriptionValidation,
  updateEligibilityValidation,
  updateLocationValidation,
  updateLastDateValidation
} from '../validations/placement.validation.js';
import { placementLimiter } from '../middlewares/rateLimiter.js';
const router = Router();

const staffRoles = ["placement_staff", "super_admin", "admin"];

router.route("/").post(verifyUserWithRole(staffRoles), placementLimiter, createPlacementValidation, validate, newPlacement);
router.route("/").get(getAllPlacements);
router.route("/:id").delete(verifyUserWithRole(staffRoles), placementIdValidation, validate, deletePlacement);
router.route("/:id").put(verifyUserWithRole(staffRoles), updatePlacementValidation, validate, updatePlacement);
router.route("/job-title/:id").put(verifyUserWithRole(staffRoles), updateJobTitleValidation, validate, updateJobTitle);
router.route("/description/:id").put(verifyUserWithRole(staffRoles), updateDescriptionValidation, validate, updateDescription);
router.route("/eligibility/:id").put(verifyUserWithRole(staffRoles), updateEligibilityValidation, validate, updateEligibility);
router.route("/location/:id").put(verifyUserWithRole(staffRoles), updateLocationValidation, validate, updateLocation);
router.route("/last-date/:id").put(verifyUserWithRole(staffRoles), updateLastDateValidation, validate, updateLastDate);
export default router
