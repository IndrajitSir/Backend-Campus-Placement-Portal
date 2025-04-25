import { Router } from "express";
import {
    getAppliedCandidates,
    getSelectedCandidates,
    getShortlistedCandidates,
    getRejectedCandidates
} from "../controllers/application.controller.js";
import { verifyUserWithRole } from "../../middlewares/verifyUser.middleware.js";
const router = Router();

router.route("/applied-candidates").get(verifyUserWithRole(["super_admin", "placement_staff", "admin"]), getAppliedCandidates);
router.route("/selected-candidates").get(getSelectedCandidates);
router.route("/shortlisted-candidates").get(getShortlistedCandidates);
router.route("/rejected-candidates").get(getRejectedCandidates);

export default router;