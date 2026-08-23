import { Router } from "express";
import { sendMessage, getConversation } from "../controllers/message.controller.js"
import { verifyUser } from "../../middlewares/verifyUser.middleware.js"
import { validate } from "../../middlewares/validate.middleware.js"
import { sendMessageValidation, getConversationValidation } from "../../validations/message.validation.js"
const router = Router();

router.use(verifyUser);

router.route("/send").post(sendMessageValidation, validate, sendMessage);
router.route("/conversation/:senderId/:receiverId").get(getConversationValidation, validate, getConversation);

export default router
