import { Router } from "express";
import { sendMessage, getConversation } from "../controllers/message.controller.js"
import { verifyUser } from "../../middlewares/verifyUser.middleware.js"
const router = Router();

router.use(verifyUser);

router.route("/send").post(sendMessage);
router.route("/conversation/:senderId/:receiverId").get(getConversation);

export default router