import { Router } from 'express';
import { createNewStudent, createNewStaff, deleteUser } from "../controllers/admin.controller.js";
import { verifyUserWithRole } from "../middlewares/verifyUser.middleware.js";
import { registerAdmin } from '../controllers/auth.controller.js';
import { updateApproval } from '../controllers/student.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { registerAdminValidation } from '../validations/auth.validation.js';
import { createStudentValidation, createStaffValidation, deleteUserValidation, changeApprovalValidation } from '../validations/admin.validation.js';
const router = Router();

router.route("/change-student-approval").put(verifyUserWithRole(["super_admin", "admin"]), changeApprovalValidation, validate, updateApproval);
router.route("/create-new-student").post(verifyUserWithRole(["super_admin", "admin"]), createStudentValidation, validate, createNewStudent);
router.route("/create-new-placement_staff").post(verifyUserWithRole(["super_admin", "admin"]), createStaffValidation, validate, createNewStaff("placement_staff"));
router.route("/create-new-admin").post(verifyUserWithRole(["super_admin"]), registerAdminValidation, validate, registerAdmin);
router.route("/delete-user").post(verifyUserWithRole(["super_admin", "admin"]), deleteUserValidation, validate, deleteUser);
export default router
