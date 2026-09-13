import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import logger from "../utils/Logger/logger.js";

/**
 * Socket.io middleware that verifies the JWT from the handshake's
 * `auth.token` field, then loads the full user from the DB by _id.
 * The token itself carries only the user _id (email/name/role are never
 * embedded) — so we fetch the fresh document and attach it to
 * `socket.data.user` so downstream handlers can trust it.
 *
 * On failure the socket is disconnected with a descriptive reason.
 */
export async function socketAuthMiddleware(socket, next) {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.query?.token ||
    null;

  if (!token) {
    logger.warn(`Socket rejected: no token provided (id=${socket.id})`);
    return next(new Error("Authentication required"));
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded?._id);
    if (!user) {
      logger.warn(`Socket rejected: user not found (id=${socket.id})`);
      return next(new Error("Invalid or expired token"));
    }

    socket.data.user = user;
    next();
  } catch (err) {
    logger.warn(`Socket rejected: invalid token (id=${socket.id}, reason=${err.message})`);
    return next(new Error("Invalid or expired token"));
  }
}
