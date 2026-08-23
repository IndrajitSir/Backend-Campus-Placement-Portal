import jwt from "jsonwebtoken";
import logger from "../utils/Logger/logger.js";

/**
 * Socket.io middleware that verifies the JWT from the handshake's
 * `auth.token` field. If valid, attaches `socket.data.user` so
 * downstream handlers can trust the connection.
 *
 * On failure the socket is disconnected with a descriptive reason.
 */
export function socketAuthMiddleware(socket, next) {
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
    socket.data.user = decoded;
    next();
  } catch (err) {
    logger.warn(`Socket rejected: invalid token (id=${socket.id}, reason=${err.message})`);
    return next(new Error("Invalid or expired token"));
  }
}
