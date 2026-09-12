import { Bookmark } from "../../models/bookmark.model.js";
import { Placement } from "../../models/placement.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import mongoose from "mongoose";

const listBookmarks = asyncHandler(async (req, res) => {
  const bookmarks = await Bookmark.find({ user_id: req.user._id })
    .sort({ createdAt: -1 })
    .populate("placement_id");

  const placements = bookmarks
    .map((b) => b.placement_id)
    .filter((p) => p !== null && p !== undefined);

  return res.status(200).json(
    new ApiResponse(200, {
      placementIds: bookmarks.map((b) => b.placement_id?.toString()).filter(Boolean),
      placements,
    }, "Bookmarks fetched")
  );
});

const addBookmark = asyncHandler(async (req, res) => {
  const { placementId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(placementId)) {
    throw new ApiError(400, "Invalid placement id");
  }

  const placement = await Placement.findById(placementId);
  if (!placement) {
    throw new ApiError(404, "Placement not found");
  }

  // Upsert semantics: re-bookmarking is idempotent (duplicate key ignored).
  const bookmark = await Bookmark.findOneAndUpdate(
    { user_id: req.user._id, placement_id: placementId },
    { $setOnInsert: { user_id: req.user._id, placement_id: placementId } },
    { new: true, upsert: true }
  );

  return res.status(201).json(new ApiResponse(201, { bookmark }, "Bookmark added"));
});

const removeBookmark = asyncHandler(async (req, res) => {
  const { placementId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(placementId)) {
    throw new ApiError(400, "Invalid placement id");
  }

  // Idempotent: deleting a non-existent bookmark is still a success.
  await Bookmark.findOneAndDelete({ user_id: req.user._id, placement_id: placementId });

  return res.status(200).json(new ApiResponse(200, { deleted: true }, "Bookmark removed"));
});

export { listBookmarks, addBookmark, removeBookmark };
