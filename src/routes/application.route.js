import { Router } from 'express';
import { verifyUserWithRole } from '../middlewares/verifyUser.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { applyForPlacementValidation, updateStatusValidation, deleteApplicationValidation } from '../validations/application.validation.js';
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

const adminRoles = ["super_admin", "placement_staff", "admin"];

router.route("/:placementId").post(verifyUserWithRole(["student"]), applyForPlacementValidation, validate, applyForPlacement);
router.route("/applied-for-job").get(verifyUserWithRole(["student"]), appliedApplication);
router.route("/applied-candidates").get(verifyUserWithRole(adminRoles), getAppliedCandidates);
router.route("/selected-candidates").get(verifyUserWithRole(adminRoles), getSelectedCandidates);
router.route("/shortlisted-candidates").get(verifyUserWithRole(adminRoles), getShortlistedCandidates);
router.route("/rejected-candidates").get(verifyUserWithRole(adminRoles), getRejectedCandidates);
router.route("/update-status").put(verifyUserWithRole(adminRoles), updateStatusValidation, validate, updateStatus);
router.route("/delete").delete(verifyUserWithRole(["super_admin", "admin"]), deleteApplicationValidation, validate, deleteApplicationRecord);
export default router
