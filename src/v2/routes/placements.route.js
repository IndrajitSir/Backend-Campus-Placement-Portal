import { Router } from "express";
import { getAllPlacementsPaginated } from "../controllers/placement.controller.js";
const router = Router();

router.route("/").get(getAllPlacementsPaginated);

export default router;