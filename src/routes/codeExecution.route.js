import { Router } from "express";
import { executeCode } from "../controllers/codeExecution.controller.js";
import { verifyUser } from "../middlewares/verifyUser.middleware.js";
import { rateLimit } from "express-rate-limit";

const router = Router();

// Strict rate limit: 20 executions per 10 minutes per IP
const codeExecLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many code execution requests. Please wait a few minutes." },
});

router.post("/execute", verifyUser, codeExecLimiter, executeCode);

export default router;
