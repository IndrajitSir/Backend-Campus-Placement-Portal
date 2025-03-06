import mongoose from "mongoose";

const connectDB = async ()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME}`);
        console.log(`MONGODB CONNECTED!! DB Host: ${connectionInstance.connection.host}`);

    } catch (error) {
        console.error("MongoDB connection ERROR:", error);
        throw error
    }
}

export default connectDB;