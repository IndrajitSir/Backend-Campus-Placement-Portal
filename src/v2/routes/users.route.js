import { Router } from "express";
import { getAllPlacementStaffsOrAdmins } from "../controllers/users.controller.js";
const router = Router();

router.route("/all-users/:role").get(getAllPlacementStaffsOrAdmins);

export default router;