import { Router } from 'express';
import { logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    changeCurrentName,
    changeCurrentEmail,
    updatePhoneNumber,
    getAllPlacementStaffs,
    getAllAdmins,
    getNonSuperAdminUsers,
    getOneUser,
    getUserById
 } from "../controllers/user.controller.js";
import { verifyUser } from '../middlewares/verifyUser.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
    changePasswordValidation,
    updateAccountValidation,
    updateNameValidation,
    updateEmailValidation,
    updatePhoneValidation,
    getUserByIdValidation
} from '../validations/user.validation.js';
const router = Router();

router.use(verifyUser);

router.route("/current-user").get(getCurrentUser);
router.route("/logout").post(logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/update-password").put(changePasswordValidation, validate, changeCurrentPassword);
router.route("/update-account").put(updateAccountValidation, validate, updateAccountDetails);
router.route("/update-name").put(updateNameValidation, validate, changeCurrentName);
router.route("/update-email").put(updateEmailValidation, validate, changeCurrentEmail);
router.route("/update-phoneNumber").put(updatePhoneValidation, validate, updatePhoneNumber);
router.route("/placement-staff-all").get(getAllPlacementStaffs);
router.route("/admin-all").get(getAllAdmins);
router.route("/all-users-nameAndEmail").get(getNonSuperAdminUsers);
router.route("/one/:nameOremail(*)").get(getOneUser);
router.route("/:userId").get(getUserByIdValidation, validate, getUserById);
export default router
