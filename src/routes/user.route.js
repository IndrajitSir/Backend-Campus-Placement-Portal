import { Router } from 'express';
import { logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, changeCurrentName, changeCurrentEmail, updatePhoneNumber } from "../controllers/user.controller.js";
import { verifyUser } from '../middlewares/verifyUser.middleware.js';
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
export default router