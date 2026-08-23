import { Router } from "express";
import {
    sendFrindRequest,
    incomingFrindRequest,
    respondToFrindRequest,
    getAllFriends
} from "../controllers/friendRequest.controller.js"
import { verifyUser } from "../../middlewares/verifyUser.middleware.js"
import { validate } from "../../middlewares/validate.middleware.js"
import { sendFriendRequestValidation, respondToFriendRequestValidation } from "../../validations/friendRequest.validation.js"
const router = Router();

router.use(verifyUser);
router.route("/friends").get(getAllFriends);
router.route("/send").post(sendFriendRequestValidation, validate, sendFrindRequest);
router.route("/incoming").get(incomingFrindRequest);
router.route("/respond").put(respondToFriendRequestValidation, validate, respondToFrindRequest);

export default router
