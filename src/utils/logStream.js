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
    const stats = fs.statSync(logPath);
    const startPos = Math.max(0, stats.size - 5000);
    const stream = fs.createReadStream(logPath, {
      encoding: "utf8",
      start: startPos
    });

    let data = "";
    stream.on("data", chunk => {
      data += chunk;
    });
    stream.on("error", err => {
      console.error("Error reading log file:", err);
    });

    stream.on("end", () => {
      io.to("admin-room").emit("log:update", data.split("\n").filter(Boolean).slice(-10)); // Send last 10 lines
    });
  });
};

export const logView = (socket) => {
  const logPath = path.join("logs", "combined.log");
  try {
    const stats = fs.statSync(logPath);
    const startPos = Math.max(0, stats.size - 5000);
    const stream = fs.createReadStream(logPath, {
      encoding: "utf8",
      start: startPos
    });

    let data = "";
    stream.on("data", chunk => {
      data += chunk;
    });
    stream.on("error", err => {
      console.error("Error reading log file:", err);
    });

    stream.on("end", () => {
      socket.emit("log:view", data.split("\n").filter(Boolean).slice(-10)); // Send last 10 lines
    });
  } catch (err) {
    console.error("Failed to read logs on connect: ", err.message)
  }
}