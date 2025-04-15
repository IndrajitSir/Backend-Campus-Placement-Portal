import fs from "fs";
import path from "path";
import chokidar from "chokidar";

export const streamLogs = (io) => {
  const logPath = path.join("logs", "combined.log");

  // Watch log file for changes
  const watcher = chokidar.watch(logPath, {
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on("change", () => {
    const stream = fs.createReadStream(logPath, {
      encoding: "utf8",
      start: fs.statSync(logPath).size - 5000, // Read last 5KB
    });

    let data = "";
    stream.on("data", chunk => {
      data += chunk;
    });

    stream.on("end", () => {
      io.to("admin-room").emit("log:update", data.split("\n").filter(Boolean).slice(-10)); // Send last 10 lines
    });
  });
};
