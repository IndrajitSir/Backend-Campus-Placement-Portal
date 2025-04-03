import { Router } from 'express';
import { newPlacement, getAllPlacements, deletePlacement, updatePlacement, updateJobTitle, updateDescription, updateEligibility, updateLocation, updateLastDate,  } from '../controllers/placement.controller.js';
import { verifyUserWithRole } from '../middlewares/verifyUser.middleware.js';
const router = Router();

router.route("/").post(verifyUserWithRole(["placement_staff", "super_admin", "admin"]), newPlacement);
router.route("/").get(getAllPlacements);
router.route("/:id").delete(verifyUserWithRole(["placement_staff", "super_admin", "admin"]), deletePlacement);
router.route("/:id").put(verifyUserWithRole(["placement_staff", "super_admin", "admin"]), updatePlacement);
router.route("/job-title/:id").put(verifyUserWithRole(["placement_staff", "super_admin", "admin"]), updateJobTitle);
router.route("/description/:id").put(verifyUserWithRole(["placement_staff", "super_admin", "admin"]), updateDescription);
router.route("/eligibility/:id").put(verifyUserWithRole(["placement_staff", "super_admin", "admin"]), updateEligibility);
router.route("/location/:id").put(verifyUserWithRole(["placement_staff", "super_admin", "admin"]), updateLocation);
router.route("/last-date/:id").put(verifyUserWithRole(["placement_staff", "super_admin", "admin"]), updateLastDate);
export default router