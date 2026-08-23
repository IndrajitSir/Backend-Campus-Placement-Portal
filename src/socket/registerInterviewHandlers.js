import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/Logger/logger.js';
import { activeRooms, roomParticipants } from '../constants.js';
import { timers } from '../constants.js';

const MAX_CODE_LENGTH = 100000;
const MAX_QUESTION_LENGTH = 10000;
const MAX_NAME_LENGTH = 100;

function isStringSafe(value, maxLen) {
    return typeof value === "string" && value.length <= maxLen;
}

export function registerInterviewHandlers(io, socket) {
    // --- Room lifecycle ---
    socket.on("create-room", (ack) => {
        const user = socket.data.user;
        if (!user || !["placement_staff", "admin", "super_admin"].includes(user.role)) {
            if (ack) return ack({ success: false, message: "Only staff/admin can create rooms" });
            return;
        }
        const roomId = uuidv4();
        activeRooms.add(roomId);
        roomParticipants.set(roomId, []);
        logger.info(`Room created: ${roomId} by user ${user._id}`);
        if (ack) ack({ success: true, roomId: roomId });
    });

    socket.on("isLive", ({ roomId }, ack) => {
        if (!roomId || typeof roomId !== "string") {
            if (ack) return ack({ success: false, message: "Invalid roomId" });
            return;
        }
        if (activeRooms.has(roomId)) {
            io.to(roomId).emit("isLive");
            if (ack) { return ack({ success: true }); }
        } else {
            if (ack) return ack({ success: false, message: "Room not found" });
        }
    });

    // --- Join / leave ---
    socket.on("join-room", ({ roomId, role, name }, ack) => {
        if (!roomId || typeof roomId !== "string") {
            if (ack) return ack({ success: false, message: "Invalid roomId" });
            return;
        }
        if (!role || typeof role !== "string") {
            if (ack) return ack({ success: false, message: "Role is required" });
            return;
        }
        if (!isStringSafe(name, MAX_NAME_LENGTH)) {
            if (ack) return ack({ success: false, message: "Invalid name" });
            return;
        }
        if (!activeRooms.has(roomId)) {
            logger.warn(`Invalid room id entered: ${roomId}`);
            if (ack) { return ack({ success: false, message: `Room not found for this id: ${roomId}` }); }
            return;
        }
        socket.join(roomId);
        socket.data.role = role;
        socket.data.name = name;
        logger.info(`${role} having name: ${name}, joined room: ${roomId}`);
        if (timers[roomId]) {
            io.to(roomId).emit("chat:timerStarted", { startedAt: timers[roomId] });
        }
        if (ack) { return ack({ success: true }); }
    });

    // --- Participant tracking ---
    socket.on("interview:joined", ({ roomId, userId, name, role }) => {
        if (!activeRooms.has(roomId)) return;
        const participants = roomParticipants.get(roomId) || [];
        if (!participants.some(p => p.userId === userId)) {
            participants.push({ userId, name, role, socketId: socket.id });
            roomParticipants.set(roomId, participants);
        }
        io.to(roomId).emit("interview:participantJoined", { userId, name, role });
    });

    // Clean up on disconnect
    socket.on("disconnect", () => {
        for (const [roomId, participants] of roomParticipants.entries()) {
            const idx = participants.findIndex(p => p.socketId === socket.id);
            if (idx !== -1) {
                const removed = participants.splice(idx, 1)[0];
                io.to(roomId).emit("interview:participantLeft", {
                    userId: removed.userId,
                    name: removed.name,
                });
            }
        }
    });

    // --- Invite ---
    socket.on("interview:invite", ({ roomId, targetUserId, targetUserName, inviterName, inviterRole }) => {
        if (!activeRooms.has(roomId)) return;
        logger.info(`Invite sent: ${inviterName} -> ${targetUserName} for room ${roomId}`);
        io.emit("interview:invited", {
            roomId,
            targetUserId,
            targetUserName,
            inviterName,
            inviterRole,
        });
    });

    // --- Language sync ---
    socket.on("interview:languageChange", ({ roomId, language }) => {
        if (!roomId || !language) return;
        socket.to(roomId).emit("interview:languageChange", { language });
    });

    // --- Code sync ---
    socket.on("codeUpdate", ({ roomId, code }, ack) => {
        if (!roomId || typeof roomId !== "string") {
            if (ack) return ack({ success: false, message: "Invalid roomId" });
            return;
        }
        if (!isStringSafe(code, MAX_CODE_LENGTH)) {
            if (ack) return ack({ success: false, message: "Code too long" });
            return;
        }
        const rooms = Array.from(socket.rooms);
        if (!rooms.includes(roomId)) {
            logger.warn(`Socket ${socket.id} tried to update code for room ${roomId} but is not a participant.`);
            if (ack) return ack({ success: false, error: "Not authorized for this room." });
            return;
        }
        socket.to(roomId).emit("codeUpdate", code);
        if (ack) { return ack({ success: true }); }
    });

    // --- Questions ---
    socket.on("send-question", ({ roomId, question, snapshotCode }, ack) => {
        if (!roomId || typeof roomId !== "string") {
            if (ack) return ack({ success: false, message: "Invalid roomId" });
            return;
        }
        if (!isStringSafe(question, MAX_QUESTION_LENGTH)) {
            if (ack) return ack({ success: false, message: "Question too long" });
            return;
        }
        if (snapshotCode && !isStringSafe(snapshotCode, MAX_CODE_LENGTH)) {
            if (ack) return ack({ success: false, message: "Snapshot code too long" });
            return;
        }
        io.to(roomId).emit("receive-question", { question, snapshotCode });
        if (ack) { return ack({ success: true }); }
    });

    socket.on("set-question", ({ roomId, question, code }, ack) => {
        if (!roomId || typeof roomId !== "string") {
            if (ack) return ack({ success: false, message: "Invalid roomId" });
            return;
        }
        if (!isStringSafe(question, MAX_QUESTION_LENGTH)) {
            if (ack) return ack({ success: false, message: "Question too long" });
            return;
        }
        if (code && !isStringSafe(code, MAX_CODE_LENGTH)) {
            if (ack) return ack({ success: false, message: "Code too long" });
            return;
        }
        io.to(roomId).emit("receive-set-question", { question, code });
        if (ack) { return ack({ success: true }); }
    });

    socket.on("submit-explanation", (payload, ack) => {
        if (!payload?.roomId || typeof payload.roomId !== "string") {
            if (ack) return ack({ success: false, message: "Invalid roomId" });
            return;
        }
        io.to(payload.roomId).emit("receive-explanation", {
            roomId: payload.roomId,
            askedQuestion: payload.askedQuestion,
            explanation: typeof payload.explanation === "string" ? payload.explanation.slice(0, MAX_QUESTION_LENGTH) : "",
        });
        if (ack) { return ack({ success: true }); }
    });
}
