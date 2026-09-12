import { Router } from "express";
import {
  listNotifications,
  markNotificationsRead,
  deleteNotification,
} from "../controllers/notification.controller.js";
import { verifyUser } from "../../middlewares/verifyUser.middleware.js";

const router = Router();

router.use(verifyUser);

router.route("/").get(listNotifications);
router.route("/mark-read").put(markNotificationsRead);
router.route("/:id").delete(deleteNotification);

export default router;
