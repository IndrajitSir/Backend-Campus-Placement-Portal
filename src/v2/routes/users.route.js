import { Router } from "express";
import { getAllPlacementStaffsOrAdmins, getAllUsers } from "../controllers/users.controller.js";
const router = Router();

router.route("/all-users/:role").get(getAllPlacementStaffsOrAdmins);
router.route("/").get(getAllUsers);

export default router;