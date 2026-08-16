import fs from "fs";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "logs");

/**
 * Resolve the current application log file. The winston logger writes
 * `application-%DATE%.log` (daily rotation) plus a separate `error.log`,
 * so pick the newest `application-*.log` and fall back to `error.log`.
 */
export function getCurrentLogPath() {
  let dir;
  try {
    dir = fs.readdirSync(LOG_DIR);
  } catch {
    return null;
  }
  const appLogs = dir
    .filter((f) => /^application-.*\.log$/.test(f))
    .map((f) => ({ name: f, mtime: fs.statSync(path.join(LOG_DIR, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  const best = appLogs[0]?.name || dir.find((f) => f === "error.log");
  return best ? path.join(LOG_DIR, best) : null;
}

/**
 * Read the tail of the current log file and return the last `maxLines`
 * non-empty lines. Returns an empty array if no log file exists yet.
 */
export function readRecentLogLines(maxLines = 10) {
  const logPath = getCurrentLogPath();
  if (!logPath) return [];
  try {
    const stats = fs.statSync(logPath);
    const startPos = Math.max(0, stats.size - 5000);
    const stream = fs.createReadStream(logPath, {
      encoding: "utf8",
      start: startPos,
    });
    return new Promise((resolve) => {
      let data = "";
      stream.on("data", (chunk) => (data += chunk));
      stream.on("error", () => resolve([]));
      stream.on("end", () => resolve(data.split("\n").filter(Boolean).slice(-maxLines)));
    });
  } catch {
    return [];
  }
}
