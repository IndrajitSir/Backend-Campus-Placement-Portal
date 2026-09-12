import { Notification } from "../../models/notification.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import mongoose from "mongoose";

/**
 * Saves a notification for a user and emits it over socket.io to that user's
 * personal room (rooms are joined in setupSocket after socket auth).
 */
export const createAndEmitNotification = async (io, { userId, type, title, body, link }) => {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      body: body || "",
      link: link || "",
    });

    if (io) {
      io.to(userId.toString()).emit("notification:new", notification);
    }

    return notification;
  } catch (err) {
    // Notification failures must never break the caller's main flow.
    console.error(`Failed to create notification for user ${userId}: ${err?.message}`);
    return null;
  }
};

const listNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
  const unreadOnly = req.query.unread === "true";

  const filter = { user: req.user._id };
  if (unreadOnly) filter.read = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      notifications,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      total,
    }, "Notifications fetched")
  );
});

const markNotificationsRead = asyncHandler(async (req, res) => {
  const { ids, all } = req.body || {};

  let filter;
  if (all === true) {
    filter = { user: req.user._id, read: false };
  } else {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ApiError(400, "Provide notification ids or all=true");
    }
    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      throw new ApiError(400, "No valid notification ids provided");
    }
    // Only the user's own notifications can ever be modified.
    filter = { user: req.user._id, _id: { $in: validIds }, read: false };
  }

  const result = await Notification.updateMany(filter, { $set: { read: true } });

  return res.status(200).json(
    new ApiResponse(200, { modifiedCount: result.modifiedCount ?? 0 }, "Notifications marked as read")
  );
});

const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid notification id");
  }

  const deleted = await Notification.findOneAndDelete({ _id: id, user: req.user._id });
  if (!deleted) {
    throw new ApiError(404, "Notification not found");
  }

  return res.status(200).json(new ApiResponse(200, { deleted: true }, "Notification deleted"));
});

export { listNotifications, markNotificationsRead, deleteNotification };
