import { Router } from 'express';
import { verifyUserWithRole } from '../middlewares/verifyUser.middleware.js';
import {
    applyForPlacement,
    appliedApplication,
    getAppliedCandidates,
    getSelectedCandidates,
    getShortlistedCandidates,
    getRejectedCandidates,
    updateStatus,
    deleteApplicationRecord
} from '../controllers/application.controller.js';
const router = Router();

router.route("/:placementId").post(verifyUserWithRole(["student"]), applyForPlacement);
router.route("/applied-for-job").get(verifyUserWithRole(["student"]), appliedApplication);
router.route("/applied-candidates").get(verifyUserWithRole(["super_admin", "placement_staff", "admin"]), getAppliedCandidates);
router.route("/selected-candidates").get(getSelectedCandidates);
router.route("/shortlisted-candidates").get(getShortlistedCandidates);
router.route("/rejected-candidates").get(getRejectedCandidates);
router.route("/update-status").put(verifyUserWithRole(["super_admin", "placement_staff", "admin"]), updateStatus);
router.route("/delete").delete(verifyUserWithRole(["super_admin", "admin"]), deleteApplicationRecord)
export default router