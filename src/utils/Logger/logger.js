import winston from "winston";
import DailyRotateFile from 'winston-daily-rotate-file';
import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";

const isProduction = process.env.NODE_ENV === "production";
const logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN);

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

// Production → log to console + Logtail
if (isProduction) {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    new LogtailTransport(logtail) // send logs to Logtail
  );
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
