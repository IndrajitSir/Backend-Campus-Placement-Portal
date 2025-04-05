import { Router } from 'express';
import { logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, changeCurrentName, changeCurrentEmail, updatePhoneNumber } from "../controllers/user.controller.js";
import { verifyUser } from '../middlewares/verifyUser.middleware.js';
const router = Router();

router.use(verifyUser);

router.route("/current-user").get(getCurrentUser);
router.route("/logout").post(logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/update-password").put(changeCurrentPassword);
router.route("/update-account").put(updateAccountDetails);
router.route("/update-name").put(changeCurrentName);
router.route("/update-email").put(changeCurrentEmail);
router.route("/update-phoneNumber").put(updatePhoneNumber);
export default router