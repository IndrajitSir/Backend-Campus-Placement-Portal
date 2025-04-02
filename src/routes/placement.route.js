import { Router } from 'express';
import { newPlacement, getAllPlacements, deletePlacement, updatePlacement } from '../controllers/placement.controller.js';
import { verifyUserWithRole } from '../middlewares/verifyUser.middleware.js';
const router = Router();

router.route("/").post(verifyUserWithRole(["placement_staff", "super_admin", "admin"]), newPlacement);
router.route("/").get(getAllPlacements);
router.route("/:id").delete(verifyUserWithRole(["placement_staff", "super_admin", "admin"]), deletePlacement);
router.route("/:id").put(verifyUserWithRole(["placement_staff", "super_admin", "admin"]), updatePlacement);

export default router