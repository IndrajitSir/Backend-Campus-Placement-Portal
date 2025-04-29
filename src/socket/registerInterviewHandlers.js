import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/Logger/logger.js'
import { activeRooms } from '../constants.js';
import { timers } from '../constants.js';
export function registerInterviewHandlers(io, socket) {
    socket.on("create-room", (ack) => {
        const roomId = uuidv4();
        activeRooms.add(roomId);
        if (ack) ack({ success: true, roomId: roomId });
    });

    socket.on("isLive", ({ roomId }, ack) => {
        if (roomId && activeRooms.has(roomId)) {
            io.to(roomId).emit("isLive");
            if (ack) { return ack({ success: true }); }
        }
    });

    socket.on("join-room", ({ roomId, role, name }, ack) => {
        if (!role || !roomId) return;
        if (!activeRooms.has(roomId)) { // const room = io.sockets.adapter.rooms.get(roomId)
            console.log(`Invalid room id entered: ${roomId} other ids in room : ${JSON.stringify(activeRooms)}`);
            if (ack) { return ack({ success: false, message: `Room not found for this id: ${roomId}` }); }
            return;
        }
        socket.join(roomId);
        socket.data.role = role;
        socket.data.name = name;
        logger.info(`${role} having name: ${name}, joined room: ${roomId || "N/A"}`);
        console.log(`${role} having name: ${name}, joined room: ${roomId || "N/A"}`);
        io.in(roomId).fetchSockets().then(sockets => {
            console.log("Sockets in interview room:", sockets.map(s => s.id));
        });
        if (timers[roomId]) {
            io.to(roomId).emit("chat:timerStarted", { startedAt: timers[roomId] })
        }
        if (ack) { return ack({ success: true }); }
    });

    socket.on("codeUpdate", ({ roomId, code }, ack) => {
        console.log("Interview id in code update: ", roomId);
        if (!roomId) return;
        const rooms = Array.from(socket.rooms);
        if (!rooms.includes(roomId)) {
            console.warn(`Socket ${socket.id} tried to update code for room ${roomId} but is not a participant.`);
            if (ack) {
                return ack({ success: false, error: "Not authorized for this room." });
            }
        }
        console.log("arrived at codeUpdate: ", code);
        io.to(roomId).emit("codeUpdate", code);
        if (ack) { return ack({ success: true });}
    });

    socket.on("send-question", ({ roomId, question, snapshotCode }, ack) => {
        if (!roomId) return;
        io.to(roomId).emit("receive-question", { question, snapshotCode });
        if (ack) { return ack({ success: true });}
    });

    socket.on("set-question", ({ roomId, question, code }, ack) => {
        if (!roomId) return;
        io.to(roomId).emit("receive-set-question", { question, code });
        if (ack) { return ack({ success: true });}
    });

    socket.on("submit-explanation", (payload, ack) => {
        if (!payload.roomId) return;
        io.to(payload.roomId).emit("receive-explanation", payload);
        if (ack) { return ack({ success: true });}
    });
}