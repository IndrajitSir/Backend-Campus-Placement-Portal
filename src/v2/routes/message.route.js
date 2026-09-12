import { Router } from "express";
import { sendMessage, getConversation, getConversations } from "../controllers/message.controller.js"
import { verifyUser } from "../../middlewares/verifyUser.middleware.js"
import { validate } from "../../middlewares/validate.middleware.js"
import { sendMessageValidation, getConversationValidation, getConversationsValidation } from "../../validations/message.validation.js"
const router = Router();

router.use(verifyUser);

router.route("/send").post(sendMessageValidation, validate, sendMessage);
router.route("/conversation/:senderId/:receiverId").get(getConversationValidation, validate, getConversation);
router.route("/conversations/:userId").get(getConversationsValidation, validate, getConversations);

export default router
