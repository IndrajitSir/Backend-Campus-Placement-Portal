import { Router } from "express";
import { getAllStudents, getPublicStudentProfile } from "../controllers/students.controller.js";
import { verifyUser, verifyUserWithRole } from "../../middlewares/verifyUser.middleware.js";
const router = Router();

router.route("/all").get(verifyUserWithRole(["placement_staff", "super_admin", "admin"]), getAllStudents);
router.route("/public/:studentId").get(verifyUser, getPublicStudentProfile);

export default router;
