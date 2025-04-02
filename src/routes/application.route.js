import {Router} from 'express';
import { verifyUserWithRole } from '../middlewares/verifyUser.middleware.js';
import { applyForPlacement, appliedApllication, getAppliedCandidates, getSelectedCandidates, getShortlistedCandidates, getRejectedCandidates } from '../controllers/application.controller.js';
const router = Router();

router.route("/:placementId").post(verifyUserWithRole(["student"]), applyForPlacement);
router.route("/applied-for-job").get(verifyUserWithRole(["student"]), appliedApllication);
router.route("/applied-candidates").get(verifyUserWithRole(["super_admin", "placement_staff", "admin"]), getAppliedCandidates);
router.route("/selected-candidates").get(getSelectedCandidates);
router.route("/shortlisted-candidates").get(getShortlistedCandidates);
router.route("/rejected-candidates").get(getRejectedCandidates);

export default router