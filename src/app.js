import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import passport from "./config/passport.js"
import session from 'express-session';
import morgan from "morgan";
import logger from "./utils/Logger/logger.js";
import { createServer } from "node:http";
import { Server } from "socket.io"
import { setupSocket } from "./socket/socket.js";

const app = express();
const httpServer = createServer(app);

app.set("trust proxy", 1);

const io = new Server(httpServer, {
  cors: {
    origin: [process.env.FRONTEND_URL, "https://campus-placement-portal.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  }
});
setupSocket(io);
// streamLogs(io);
app.use((req, res, next) => {
  req.io = io;
  next();
});
app.use(cors({
  origin: [process.env.FRONTEND_URL, "https://campus-placement-portal.vercel.app"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
}));
app.use(morgan("combined", {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));
app.use((req, res, next) => {
  req.log = logger.child({
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

// Routes import
import healthcheckRouter from "./routes/healthCheck.routes.js"
import authRoutes from "./routes/auth.route.js"
import placementRoutes from "./routes/placement.route.js"
import applicationRoutes from "./routes/application.route.js"
import userRoutes from "./routes/user.route.js"
import adminRoutes from "./routes/admin.route.js"
import studentRoutes from "./routes/student.route.js"
// import fakeDataRouter from "./fakedata/fakeData.js"
import monitorSystem from './routes/monitor_system.route.js'
import SystemAnalytics from './routes/analytics.route.js'
import interviewRoutes from './routes/interview.route.js';
//routes declaration
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/placements", placementRoutes);
app.use("/api/v1/applications", applicationRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/student", studentRoutes);
// app.use("/api/v1/fake-data", fakeDataRouter);
app.use("/api/v1/system", monitorSystem);
app.use("/api/v1/analytics", SystemAnalytics);
app.use('/api/v1/interview', interviewRoutes);
// ------------------------ V2 -------------------------------
// Routes import
import userRouter from './v2/routes/users.route.js'
import studentRouter from './v2/routes/students.route.js'
import placementRouter from './v2/routes/placements.route.js'
import applicationRouter from './v2/routes/application.route.js'
import friendRequestRouter from './v2/routes/friendRequest.route.js'
import personalChatMessageRouter from './v2/routes/message.route.js'
//routes declaration
app.use("/api/v2/users", userRouter);
app.use("/api/v2/student", studentRouter);
app.use("/api/v2/placements", placementRouter);
app.use("/api/v2/applications", applicationRouter);
app.use("/api/v2/friend-request", friendRequestRouter);
app.use("/api/v2/messages", personalChatMessageRouter);
//------------------------- V3 ---------------------------------
// Routes import
import applicationRouterV3 from './v3/routes/application.route.js'
//routes declaration
app.use("/api/v3/applications", applicationRouterV3);

export { app, httpServer }
