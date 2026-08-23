import { timers, activeRooms } from "../constants.js";
import logger from "../utils/Logger/logger.js";

const MAX_MESSAGE_LENGTH = 10000;

function isValidRoom(roomId) {
    return typeof roomId === "string" && roomId.length > 0 && activeRooms.has(roomId);
}

export function registerChatHandlers(io, socket) {
    socket.on("chat:sendMessage", ({ roomId, message }, ack) => {
        if (!isValidRoom(roomId)) {
            if (ack) { return ack({ success: false, message: `Room not found: ${roomId}` }); }
            return;
        }
        if (typeof message !== "string" || message.length === 0 || message.length > MAX_MESSAGE_LENGTH) {
            if (ack) { return ack({ success: false, message: "Invalid message" }); }
            return;
        }
        const senderUser = socket.data.user;
        const payload = {
            text: message,
            senderId: senderUser?._id,
            senderName: senderUser?.name || socket.data.name,
            timestamp: Date.now(),
        };
        io.to(roomId).emit("chat:newMessage", payload);
        if (ack) { return ack({ success: true }); }
    });

    socket.on("chat:typing", ({ roomId, sender }, ack) => {
        if (!isValidRoom(roomId)) {
            if (ack) { return ack({ success: false, message: `Room not found: ${roomId}` }); }
            return;
        }
        io.to(roomId).emit("chat:typing", { sender: sender || socket.data.name });
        if (ack) { return ack({ success: true }); }
    });

    socket.on("chat:delivered", ({ messageId, roomId }, ack) => {
        if (!isValidRoom(roomId)) {
            if (ack) { return ack({ success: false, message: `Room not found: ${roomId}` }); }
            return;
        }
        io.to(roomId).emit("chat:delivered", { messageId });
        if (ack) { return ack({ success: true }); }
    });

    socket.on("chat:seen", ({ messageId, roomId }, ack) => {
        if (!isValidRoom(roomId)) {
            if (ack) { return ack({ success: false, message: `Room not found: ${roomId}` }); }
            return;
        }
        io.to(roomId).emit("chat:seen", { messageId });
        if (ack) { return ack({ success: true }); }
    });

    // --- Message reactions ---
    socket.on("chat:react", ({ roomId, messageId, emoji }, ack) => {
        if (!isValidRoom(roomId)) {
            if (ack) { return ack({ success: false, message: `Room not found: ${roomId}` }); }
            return;
        }
        if (!messageId || typeof messageId !== "string") {
            if (ack) { return ack({ success: false, message: "Invalid messageId" }); }
            return;
        }
        if (!emoji || typeof emoji !== "string" || emoji.length > 4) {
            if (ack) { return ack({ success: false, message: "Invalid emoji" }); }
            return;
        }
        const senderUser = socket.data.user;
        io.to(roomId).emit("chat:reaction", {
            messageId,
            emoji,
            userId: senderUser?._id,
            userName: senderUser?.name || socket.data.name,
        });
        if (ack) { return ack({ success: true }); }
    });

    socket.on("chat:timerStarts", ({ roomId }, ack) => {
        if (!isValidRoom(roomId)) {
            if (ack) { return ack({ success: false, message: `Room not found: ${roomId}` }); }
            return;
        }
        const startedAt = Date.now();
        timers[roomId] = startedAt;
        io.to(roomId).emit("chat:timerStarted", { startedAt });
        if (ack) { return ack({ success: true }); }
    });
}