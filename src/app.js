import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
const app = express();

app.use(cors({  
    origin: process.env.CORS_ORIGIN,
    Credential: true
}));

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser());

// Routes import
import healthcheckRouter from "./routes/healthCheck.routes.js"
import authRoutes from "./routes/auth.route.js"
import placementRoutes from "./routes/placement.route.js"
import applicationRoutes from "./routes/application.route.js"
import userRoutes from "./routes/user.route.js"

//routes declaration
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/placements", placementRoutes);
app.use("/api/v1/applications", applicationRoutes);
app.use("/api/v1/users",userRoutes);

export { app }