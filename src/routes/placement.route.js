import {Router} from 'express';
import { newPlacement, getAllPlacements, deletePlacement } from '../controllers/placement.controller.js';
import { verifyUserWithRole } from '../middlewares/verifyUser.middleware.js';
const router = Router();

router.route("/").post(verifyUserWithRole(["placement_staff"]), newPlacement);
router.route("/").get(getAllPlacements);
router.route("/:id").delete(verifyUserWithRole(["placement_staff"]), deletePlacement);

export default router