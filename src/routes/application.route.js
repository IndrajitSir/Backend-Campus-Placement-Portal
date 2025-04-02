import {Router} from 'express';
import { verifyUserWithRole } from '../middlewares/verifyUser.middleware.js';
import { applyForPlacement, appliedApllications, getAllAppliedApplication } from '../controllers/application.controller.js';
const router = Router();

router.route("/:placementId").post(verifyUserWithRole(["student"]), applyForPlacement);
router.route("/applied-for-job").get(verifyUserWithRole(["student"]), appliedApllications);
router.route("/").get(verifyUserWithRole(["super_admin", "placement_staff", "admin"]), getAllAppliedApplication)
export default router