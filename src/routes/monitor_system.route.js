import { Router } from 'express';
import { systemStatus } from '../controllers/Monitor_System/monitor_system.js';
import { streamLogs } from '../controllers/Monitor_System/logStream.controller.js';
import { verifyUserWithRole } from '../middlewares/verifyUser.middleware.js'
const router = Router();

router.route("/status").get(/*verifyUserWithRole(["super_admin", "admin"]),*/ systemStatus);

// Live application logs for admins (Server-Sent Events).
router.route("/logs/stream").get(streamLogs);

export default router