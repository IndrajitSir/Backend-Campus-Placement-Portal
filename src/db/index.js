import mongoose from "mongoose";
import logger from "../utils/Logger/logger.js";

const connectDB = async () => {
    if (!process.env.MONGODB_URI) {
        const err = new Error("MONGODB_URI is not set. Set it (e.g. your MongoDB Atlas connection string) in the environment.");
        console.error("MongoDB connection Failed:", err.message);
        throw err;
    }
    try {
        const uri = `${process.env.MONGODB_URI}/${process.env.DB_NAME || "campusplace"}`;
        // Fail fast instead of hanging silently — otherwise Render's deploy
        // port scan times out with "No open ports detected" and no real error.
        const connectionInstance = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 15000,
            connectTimeoutMS: 15000,
        });
        logger.info(`MONGODB CONNECTED!! DB Host: ${connectionInstance.connection.host}`)
        // mongoose.set("debug", true);
    } catch (error) {
        console.error(
            "MongoDB connection Failed. Check that MONGODB_URI is reachable (Atlas network access allows this IP / cluster is not paused):",
            error?.message || error
        );
        logger.error("MongoDB connection ERROR:", error);
        throw error
    }
}

export default connectDB;
