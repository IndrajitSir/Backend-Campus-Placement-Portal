import { Router } from 'express';
import { systemStatus } from '../controllers/Monitor_System/monitor_system';
const router = Router();

router.route("/status").get(verifyUserWithRole(["super_admin", "admin"]), systemStatus);

export default router