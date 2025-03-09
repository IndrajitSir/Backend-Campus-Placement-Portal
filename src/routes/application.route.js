import {Router} from 'express';
import { verifyUserWithRole } from '../middlewares/verifyUser.middleware';
import { applyForPlacement, appliedApllications } from '../controllers/application.controller';
const router = Router();

router.route("/:placementId").post(verifyUserWithRole(["student"]), applyForPlacement);
router.route("/").get(verifyUserWithRole(["student"]), appliedApllications);