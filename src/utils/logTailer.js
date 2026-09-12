import fs from "fs";
import { getCurrentLogPath, readRecentLogLines } from "./logReader.js";

const DEFAULT_INTERVAL_MS = 2000;
const SNAPSHOT_LINES = 10;

/**
 * Read a byte range of a text file. Byte offsets are used (instead of
 * re-reading the tail each tick) so appended lines are streamed exactly once.
 */
function readRange(logPath, start, length) {
  return new Promise((resolve) => {
    const stream = fs.createReadStream(logPath, {
      encoding: "utf8",
      start,
      end: start + length - 1,
    });
    let data = "";
    stream.on("data", (chunk) => (data += chunk));
    stream.on("error", () => resolve(""));
    stream.on("end", () => resolve(data));
  });
}

/**
 * Tail the active winston log file and invoke `onLines(lines)` whenever new
 * complete lines are appended.
 *
 * Polls instead of relying on fs-watch/chokidar: winston keeps the log file
 * open and writes through the same fd, which does not reliably surface as a
 * change event on Windows. A lightweight size check is deterministic and
 * cheap, and daily rotation is handled by re-resolving the active file.
 *
 * Returns a `stop()` function that clears the poller.
 */
export function createLogTailer(onLines, intervalMs = DEFAULT_INTERVAL_MS) {
  let currentPath = getCurrentLogPath();
  let offset = 0;
  let buffer = "";
  let stopped = false;

  // Seed new viewers with the current tail, then only stream what is written
  // from this point on (no duplicate resends).
  readRecentLogLines(SNAPSHOT_LINES).then((lines) => {
    if (!stopped && lines.length) onLines(lines);
  });
  try {
    offset = currentPath ? fs.statSync(currentPath).size : 0;
  } catch {
    offset = 0;
  }

  const tick = async () => {
    if (stopped) return;
    const logPath = getCurrentLogPath();
    if (!logPath) return;

    if (logPath !== currentPath) {
      // Daily rotation — start reading the new file from the top.
      currentPath = logPath;
      offset = 0;
      buffer = "";
    }

    let size;
    try {
      size = fs.statSync(logPath).size;
    } catch {
      return;
    }

    if (size < offset) {
      // File was truncated/rotated in place.
      offset = 0;
      buffer = "";
    }
    if (size === offset) return;

    const chunk = await readRange(logPath, offset, size - offset);
    offset = size;
    buffer += chunk;

    // Hold back a trailing partial line until its newline arrives.
    const parts = buffer.split("\n");
    buffer = parts.pop() ?? "";
    const lines = parts.filter((line) => line.trim().length > 0);
    if (!stopped && lines.length) onLines(lines);
  };

  const timer = setInterval(tick, intervalMs);
  return () => {
    stopped = true;
    clearInterval(timer);
  };
}
