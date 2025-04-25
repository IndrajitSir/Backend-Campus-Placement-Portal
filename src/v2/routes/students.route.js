import { Router } from "express";
import { getAllStudents } from "../controllers/students.controller.js";
import { verifyUserWithRole } from "../../middlewares/verifyUser.middleware.js";
const router = Router();

router.route("/all").get(verifyUserWithRole(["placement_staff", "super_admin", "admin"]), getAllStudents);

export default router;