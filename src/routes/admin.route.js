import { Router } from 'express';
import { updateApproval, createNewStudent } from "../controllers/admin.controller.js";
import { verifyUserWithRole } from "../middlewares/verifyUser.middleware.js";
import { loginAdmin, registerAdmin } from '../controllers/auth.controller.js';
const router = Router();

router.route("/register").post(registerAdmin);
router.route("/login").post(loginAdmin);
router.route("/change-student-approval").patch(verifyUserWithRole(["super_admin, admin"]), updateApproval);
router.route("/create-new-student").post(verifyUserWithRole(["super_admin, admin"]), createNewStudent);
export default router