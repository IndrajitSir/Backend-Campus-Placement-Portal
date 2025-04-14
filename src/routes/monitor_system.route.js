import { Router } from 'express';
import { systemStatus } from '../controllers/Monitor_System/monitor_system.js';
import { verifyUserWithRole } from '../middlewares/verifyUser.middleware.js'
const router = Router();

router.route("/status").get(/*verifyUserWithRole(["super_admin", "admin"]),*/ systemStatus);

export default router