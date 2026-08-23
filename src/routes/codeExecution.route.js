import { Router } from "express";
import { executeCode } from "../controllers/codeExecution.controller.js";
import { verifyUser } from "../middlewares/verifyUser.middleware.js";
const router = Router();

router.post("/execute", verifyUser, executeCode);

export default router;
