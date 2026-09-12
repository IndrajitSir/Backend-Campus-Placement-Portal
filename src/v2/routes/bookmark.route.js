import { Router } from "express";
import {
  listBookmarks,
  addBookmark,
  removeBookmark,
} from "../controllers/bookmark.controller.js";
import { verifyUser } from "../../middlewares/verifyUser.middleware.js";

const router = Router();

router.use(verifyUser);

router.route("/").get(listBookmarks);
router.route("/:placementId").post(addBookmark);
router.route("/:placementId").delete(removeBookmark);

export default router;
