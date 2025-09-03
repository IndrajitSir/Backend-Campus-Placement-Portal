import { Router } from "express";
import {
    sendFrindRequest,
    incomingFrindRequest,
    respondToFrindRequest,
    getAllFriends
} from "../controllers/friendRequest.controller.js"
import { verifyUser } from "../../middlewares/verifyUser.middleware.js"
const router = Router();

router.use(verifyUser);
router.route("/:id").get(getAllFriends);
router.route("/send").post(sendFrindRequest);
router.route("/incoming/:userId").get(incomingFrindRequest);
router.route("/respond").put(respondToFrindRequest);

export default router