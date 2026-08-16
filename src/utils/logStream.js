import fs from "fs";
import { getCurrentLogPath, readRecentLogLines } from "./logReader.js";

/**
 * Stream live log lines to the admin socket room.
 *
 * Uses a poller rather than fs-watch/chokidar: winston writes through a
 * single open fd which does not reliably trigger change events on Windows.
 * (Kept in sync with `socket/registerLogHandlers.js` — this variant is the
 * io-level version; only one of the two should be active.)
 */
let pollerStarted = false;

export const streamLogs = (io) => {
  if (pollerStarted) return;
  pollerStarted = true;

  const seenSizes = new Map();

  const tick = async () => {
    const logPath = getCurrentLogPath();
    if (!logPath) return;
    let size;
    try {
      size = fs.statSync(logPath).size;
    } catch {
      return;
    }
    const last = seenSizes.get(logPath) ?? 0;
    if (size !== last) {
      seenSizes.set(logPath, size);
      if (size > 0) {
        const lines = await readRecentLogLines(10);
        if (lines.length) io.to("admin-room").emit("log:update", lines);
      }
    }
  };

  tick();
  setInterval(tick, 2000);
};

export const logView = async (socket) => {
  const lines = await readRecentLogLines(10);
  if (lines.length) socket.emit("log:view", lines);
};
