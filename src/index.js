import dotenv from "dotenv";
import connectDB from "./db/index.js";

// Load env BEFORE app.js module code executes so that app.js (session config,
// CORS origins, etc.) sees the real environment values at import time.
// NOTE: app.js must stay a dynamic import — static imports are hoisted and
// would evaluate before dotenv.config() runs.
dotenv.config({
    path: "./.env",
    override: true,
});

const { startDeadlineReminder } = await import("./utils/deadlineReminder.js");
const { app, httpServer } = await import("./app.js");

connectDB()// jab bhi ek asynchronous method complete hota hai to wo ek promise return krta hai.
    .then(() => {
        httpServer.on("error", (error) => {
            console.error("ERROR:", error);
            throw error
        })
        httpServer.listen(process.env.PORT || 8000, () => {
            console.log(`Server is listening on ${process.env.PORT}`);
        })
        startDeadlineReminder();
    })
    .catch((err) => {
        console.log("MongoDB connection Failed", err?.message || err);
        // Exit so the failure is loud and Render doesn't wait for a port that
        // will never open.
        process.exit(1);
    });
