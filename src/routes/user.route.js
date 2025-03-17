import { Router } from 'express';
import { logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, changeCurrentName, changeCurrentEmail, updateApproved, updatePhoneNumber } from "../controllers/user.controller.js";
import { verifyUser, verifyUserWithRole } from '../middlewares/verifyUser.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';
import { deleteResume, updateResume, uploadResume } from '../controllers/student.controller.js';
const router = Router();

router.use(verifyUser);

router.route("/current-user").get(getCurrentUser);
router.route("/logout").post(logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/update-password").patch(changeCurrentPassword);
router.route("/update-account").patch(updateAccountDetails);
router.route("/update-name").patch(changeCurrentName);
router.route("/update-email").patch(changeCurrentEmail);
router.route("/update-phoneNumber").patch(updatePhoneNumber);

// Student specific routes declaration
router.route("/student/upload-resume").post(upload.fields({name: "resume", maxCount: 1}), verifyUserWithRole(["student"]), uploadResume);
router.route("/student/update-resume").patch(upload.fields({name: "newResume", maxCount: 1}), verifyUserWithRole(["student"]), updateResume);
router.route("/student/delete-resume").delete(verifyUserWithRole(["student"]), deleteResume);
export default router