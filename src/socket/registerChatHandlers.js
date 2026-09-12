import { timers, activeRooms } from "../constants.js";
import logger from "../utils/Logger/logger.js";
import { v4 as uuidv4 } from 'uuid';

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
        const text = typeof message === "string" ? message : message?.text;
        if (typeof text !== "string" || text.trim().length === 0 || text.length > MAX_MESSAGE_LENGTH) {
            if (ack) { return ack({ success: false, message: "Invalid message text" }); }
            return;
        }
        const senderUser = socket.data.user;
        const msgId = (typeof message === "object" && message?.id) ? message.id : uuidv4();
        const payload = {
            id: msgId,
            text,
            senderId: senderUser?._id,
            senderName: senderUser?.name || socket.data.name || (typeof message === "object" ? message.senderName : null) || "Anonymous",
            timestamp: Date.now(),
            reactions: {},
        };
        io.to(roomId).emit("chat:newMessage", payload);
        if (ack) { return ack({ success: true, message: payload }); }
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
        if (!emoji || typeof emoji !== "string" || emoji.length > 8) {
            if (ack) { return ack({ success: false, message: "Invalid emoji" }); }
            return;
        }
        const senderUser = socket.data.user;
        const userId = senderUser?._id ? senderUser._id.toString() : socket.id;
        io.to(roomId).emit("chat:reaction", {
            messageId,
            emoji,
            userId,
            userName: senderUser?.name || socket.data.name || "Anonymous",
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