import fs from "fs";
import { getCurrentLogPath, readRecentLogLines } from "../utils/logReader.js";

/**
 * Stream the last few lines of the live log files to every admin socket.
 *
 * Polls instead of relying on fs-watch/chokidar: winston keeps the log file
 * open and writes through the same fd, which does not reliably surface as a
 * change event on Windows. A lightweight size check is deterministic and
 * cheap, and it also picks up daily rotation automatically.
 */
let pollerStarted = false;

export function registerLogHandlers(io) {
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
}

export const logView = async (socket) => {
  const lines = await readRecentLogLines(10);
  if (lines.length) socket.emit("log:view", lines);
};
