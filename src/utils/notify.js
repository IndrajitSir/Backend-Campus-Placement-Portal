import { Notification } from "../models/notification.model.js";
import { ApiResponse } from "./ApiResponse.js";

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
