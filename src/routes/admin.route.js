import { Router } from 'express';
import { createNewStudent, createNewStaff, deleteUser } from "../controllers/admin.controller.js";
import { verifyUserWithRole } from "../middlewares/verifyUser.middleware.js";
import { registerAdmin } from '../controllers/auth.controller.js';
import { updateApproval } from '../controllers/student.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { registerAdminSchema } from '../validations/auth.validation.js';
const router = Router();

// router.route("/register").post(registerAdmin);
// router.route("/login").post(loginAdmin);
router.route("/change-student-approval").put(verifyUserWithRole(["super_admin", "admin"]), updateApproval);
router.route("/create-new-student").post(verifyUserWithRole(["super_admin", "admin"]), createNewStudent);
router.route("/create-new-placement_staff").post(verifyUserWithRole(["super_admin", "admin"]), createNewStaff("placement_staff"));
router.route("/create-new-admin").post(verifyUserWithRole(["super_admin"]), validate(registerAdminSchema), registerAdmin);
router.route("/delete-user").post(verifyUserWithRole(["super_admin", "admin"]), deleteUser);
export default router