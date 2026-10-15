import { Router } from "express";
import {
  getCandidatesByStatus,
  exportApplicationsCsv
} from "../controllers/application.controller.js";
import { verifyUserWithRole } from "../../middlewares/verifyUser.middleware.js";
const router = Router();

// NOTE: /export must be declared before /:candidateStatus so it is not
// captured by the dynamic segment.
router.route("/export").get(verifyUserWithRole(["admin", "super_admin", "placement_staff"]), exportApplicationsCsv);

router.route("/shortlisted-candidates").get(verifyUserWithRole(["super_admin", "placement_staff", "admin"]), getCandidatesByStatus.bind(null, "shortlisted"));
router.route("/selected-candidates").get(verifyUserWithRole(["super_admin", "placement_staff", "admin"]), getCandidatesByStatus.bind(null, "selected"));
router.route("/applied-candidates").get(verifyUserWithRole(["super_admin", "placement_staff", "admin"]), getCandidatesByStatus.bind(null, "applied"));
router.route("/rejected-candidates").get(verifyUserWithRole(["super_admin", "placement_staff", "admin"]), getCandidatesByStatus.bind(null, "rejected"));

router.route("/:candidateStatus").get(verifyUserWithRole(["super_admin", "placement_staff", "admin"]), getCandidatesByStatus);

export default router;
