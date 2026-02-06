import { app, httpServer } from "./app.js"
import dotenv from "dotenv";
import connectDB from "./db/index.js";
dotenv.config({
    path: "./.env"
});

connectDB()// jab bhi ek asynchronous method complete hota hai to wo ek promise return krta hai.
    .then(() => {
        httpServer.on("error", (error) => {
            console.error("ERROR:", error);
            throw error
        })
        httpServer.listen(process.env.PORT || 8000, () => {
            console.log(`Server is listening on ${process.env.PORT}`);
        })
    })
    .catch((err) => {
        console.log("MongoDB connection Failed", err);
    });
