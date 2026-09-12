import jwt from "jsonwebtoken";
import { createLogTailer } from "../../utils/logTailer.js";
import logger from "../../utils/Logger/logger.js";

const HEARTBEAT_MS = 15000;
const ALLOWED_ROLES = ["admin", "super_admin"];

/**
 * EventSource cannot set an Authorization header, so the browser client is
 * authenticated by the httpOnly `accessToken` cookie. The query-param and
 * header variants are kept as fallbacks for non-browser clients / testing.
 */
const extractToken = (req) =>
  req.cookies?.accessToken ||
  req.header("Authorization")?.replace("Bearer ", "") ||
  req.query?.token ||
  null;

/**
 * Server-Sent Events stream of live application logs for admins.
 *
 * Replaces the previous socket.io `log:view` / `log:update` events. Every
 * connected admin gets one SSE connection; chat/interview sockets are
 * untouched.
 */
export function streamLogs(req, res) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized request" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message:
        error?.name === "TokenExpiredError"
          ? "Session expired, please log in again"
          : "Invalid access token",
    });
  }

  if (!ALLOWED_ROLES.includes(decoded?.role)) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  // ---- SSE handshake ----
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    // Tell nginx/Render not to buffer the stream.
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders?.();
  res.write("retry: 3000\n\n");

  const sendLogs = (lines) => {
    for (const line of lines) {
      res.write("event: log\n");
      res.write(`data: ${JSON.stringify(line)}\n\n`);
    }
  };

  const stopTailer = createLogTailer(sendLogs);

  const heartbeat = setInterval(() => {
    // Comment frames keep proxies from closing the idle connection.
    res.write(": keep-alive\n\n");
  }, HEARTBEAT_MS);

  let closed = false;
  const cleanup = () => {
    if (closed) return;
    closed = true;
    clearInterval(heartbeat);
    stopTailer();
    logger.info(`SSE log stream closed (role=${decoded?.role})`);
    res.end();
  };

  req.on("close", cleanup);
  req.on("error", cleanup);

  logger.info(`SSE log stream opened (role=${decoded?.role})`);
}
