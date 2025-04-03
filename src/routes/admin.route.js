import { Router } from 'express';
import { createNewStudent, createNewStaff } from "../controllers/admin.controller.js";
import { verifyUserWithRole } from "../middlewares/verifyUser.middleware.js";
import { registerAdmin } from '../controllers/auth.controller.js';
import { updateApproval } from '../controllers/student.controller.js';
const router = Router();

// router.route("/register").post(registerAdmin);
// router.route("/login").post(loginAdmin);
router.route("/change-student-approval").patch(verifyUserWithRole(["super_admin", "admin"]), updateApproval);
router.route("/create-new-student").post(verifyUserWithRole(["super_admin", "admin"]), createNewStudent);
router.route("/create-new-placement_staff").post(verifyUserWithRole(["super_admin", "admin"]), createNewStaff("placement_staff"));
router.route("/create-new-admin").post(verifyUserWithRole(["super_admin"]), registerAdmin);
export default router