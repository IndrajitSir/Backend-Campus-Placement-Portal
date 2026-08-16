import winston from "winston";
import DailyRotateFile from 'winston-daily-rotate-file';
import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";

const isProduction = process.env.NODE_ENV === "production";
// Logtail must never be able to crash the app. Its background sync flushes
// throw unhandled rejections when the token is invalid/revoked, which wedges
// the whole process — so only create the client in production with a token
// (dev builds never wire it in as a transport anyway).
let logtail = null;
if (isProduction && process.env.LOGTAIL_SOURCE_TOKEN) {
  logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN);
}
const transports = [];

// Development → log to files + console
if (!isProduction) {
  transports.push(
    new DailyRotateFile({
      filename: "logs/application-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
    }),
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
    }),
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

// Production → log to console + Logtail (only if a token is configured)
if (isProduction) {
  const productionTransports = [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ];
  if (logtail) {
    productionTransports.push(new LogtailTransport(logtail)); // send logs to Logtail
  }
  transports.push(...productionTransports);
}

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports,
});

export default logger;
