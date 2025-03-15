import {Router} from 'express';
import { verifyUserWithRole } from '../middlewares/verifyUser.middleware.js';
import { applyForPlacement, appliedApllications } from '../controllers/application.controller.js';
const router = Router();

router.route("/:placementId").post(verifyUserWithRole(["student"]), applyForPlacement);
router.route("/").get(verifyUserWithRole(["student"]), appliedApllications);

export default router