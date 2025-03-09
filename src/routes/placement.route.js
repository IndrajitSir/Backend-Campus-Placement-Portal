import {Router} from 'express';
import { newPlacement, getAllPlacements, deletePlacement } from '../controllers/placement.controller';
import { verifyUserWithRole } from '../middlewares/verifyUser.middleware';
const router = Router();

router.route("/").post(verifyUserWithRole(["placement_staff"]), newPlacement);
router.route("/").get(getAllPlacements);
router.route("/:id").delete(verifyUserWithRole(["placement_staff"]), deletePlacement);