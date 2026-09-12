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

router.route("/:candidateStatus").get(verifyUserWithRole(["super_admin", "placement_staff", "admin"]), getCandidatesByStatus);

export default router;
