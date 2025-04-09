import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import passport from "./config/passport.js"
import session from 'express-session';
import morgan from "morgan";
import logger from "./utils/Logger/logger.js";

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(morgan("combined", {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));
app.use((req, res, next) => {
  req.log = logger.child({
    user: req.user?._id,
    ip: req.ip,
    route: req.originalUrl,
    method: req.method
  });
  next();
});
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser());
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173"); // Match frontend
  res.header("Access-Control-Allow-Credentials", 'true'); // Required for cookies
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204); // No Content
  }

  next();
});

// Routes import
import healthcheckRouter from "./routes/healthCheck.routes.js"
import authRoutes from "./routes/auth.route.js"
import placementRoutes from "./routes/placement.route.js"
import applicationRoutes from "./routes/application.route.js"
import userRoutes from "./routes/user.route.js"
import adminRoutes from "./routes/admin.route.js"
import studentRoutes from "./routes/student.route.js"
import fakeDataRouter from "./fakedata/fakeData.js"
import monitorSystem from './routes/monitor_system.route.js'
//routes declaration
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/placements", placementRoutes);
app.use("/api/v1/applications", applicationRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/student", studentRoutes);
app.use("/api/v1/fake-data", fakeDataRouter);
app.use("/api/v1/system", monitorSystem);
export { app }