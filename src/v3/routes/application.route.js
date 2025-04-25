import { Router } from "express";
import {
  getCandidatesByStatus
} from "../controllers/application.controller.js";
import { verifyUserWithRole } from "../../middlewares/verifyUser.middleware.js";
const router = Router();

router.route("/:candidateStatus").get(verifyUserWithRole(["super_admin", "placement_staff", "admin"]), getCandidatesByStatus);

export default router;