import mongoose from "mongoose";
import logger from "../utils/Logger/logger.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME}`);
        logger.info(`MONGODB CONNECTED!! DB Host: ${connectionInstance.connection.host}`)
        // mongoose.set("debug", true);
    } catch (error) {
        logger.error("MongoDB connection ERROR:", error);
        console.error("MongoDB connection ERROR:", error);
        throw error
    }
}

export default connectDB;