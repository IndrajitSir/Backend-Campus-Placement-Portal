import { registerChatHandlers } from "./registerChatHandlers.js";
import { registerInterviewHandlers } from "./registerInterviewHandlers.js";
import { registerLogHandlers, logView } from "./registerLogHandlers.js";
import { userSocketMap } from "../constants.js";
import { socketAuthMiddleware } from "./authMiddleware.js";
import logger from "../utils/Logger/logger.js";

// Maximum concurrent connections per user to prevent socket flooding
const MAX_CONNECTIONS_PER_USER = 5;
const userConnectionCount = new Map();

export function setupSocket(io) {
    // Authenticate every incoming socket connection
    io.use(socketAuthMiddleware);

    io.on("connection", (socket) => {
        const user = socket.data.user;
        const userId = user?._id?.toString();
        const role = user?.role;

        if (!userId) {
            logger.warn(`Socket connected without valid user data, disconnecting: ${socket.id}`);
            socket.disconnect(true);
            return;
        }

        // Enforce max connections per user
        const connCount = (userConnectionCount.get(userId) || 0) + 1;
        if (connCount > MAX_CONNECTIONS_PER_USER) {
            logger.warn(`User ${userId} exceeded max socket connections (${MAX_CONNECTIONS_PER_USER}), rejecting: ${socket.id}`);
            socket.disconnect(true);
            return;
        }
        userConnectionCount.set(userId, connCount);

        addUser(userId, socket.id);
        logger.info(`Socket connected: user=${userId} role=${role} socket=${socket.id}`);

        if (role === "admin" || role === "super_admin") {
            socket.join("admin-room");
            socket.on("log:requestView", () => {
                logView(socket);
            });
        }

        registerInterviewHandlers(io, socket);
        registerChatHandlers(io, socket);
        registerLogHandlers(io, socket);

        socket.on("error", (err) => {
            logger.error(`Socket error (user=${userId}): ${err.message}`);
        });

        socket.on("disconnect", () => {
            logger.info(`Socket disconnected: user=${userId} socket=${socket.id}`);
            removeUser(socket.id);
            const current = userConnectionCount.get(userId) || 1;
            if (current <= 1) {
                userConnectionCount.delete(userId);
            } else {
                userConnectionCount.set(userId, current - 1);
            }
        });
    });
}

export function addUser(userId, socketId) {
    userSocketMap.set(userId, socketId);
}

export function removeUser(socketId) {
    for (const [userId, sId] of userSocketMap.entries()) {
        if (sId === socketId) {
            userSocketMap.delete(userId);
            break;
        }
    }
}

export function getSocketId(userId) {
    return userSocketMap.get(userId);
}