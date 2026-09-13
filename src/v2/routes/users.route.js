import { Router } from "express";
import { getAllPlacementStaffsOrAdmins, getAllUsers, updateE2EEKey, getE2EEKey } from "../controllers/users.controller.js";
import { verifyUser } from "../../middlewares/verifyUser.middleware.js";
const router = Router();

router.route("/all-users/:role").get(getAllPlacementStaffsOrAdmins);
router.route("/").get(getAllUsers);
router.route("/e2ee-key").put(verifyUser, updateE2EEKey);
router.route("/:userId/e2ee-key").get(verifyUser, getE2EEKey);

export default router;