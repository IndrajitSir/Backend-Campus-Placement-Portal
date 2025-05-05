import { timers, activeRooms } from "../constants.js";
export function registerChatHandlers(io, socket) {
    socket.on("chat:sendMessage", ({ roomId, message }, ack) => {
        if (roomId && activeRooms.has(roomId)) {
            io.to(roomId).emit("chat:newMessage", message);
            if (ack) { return ack({ success: true }); }
        } else {
            console.log(`Room has expired (id: ${roomId}) other ids in room : ${JSON.stringify(activeRooms)}`);
            if (ack) { return ack({ success: false, message: `Room not found for this id: ${roomId}` }); }
        }
    });

    socket.on("chat:typing", ({ roomId, sender }, ack) => {
        if (roomId && activeRooms.has(roomId)) {
            io.to(roomId).emit("chat:typing", { sender });
            if (ack) { return ack({ success: true }); }
        } else {
            console.log(`Room has expired (id: ${roomId}) other ids in room : ${JSON.stringify(activeRooms)}`);
            if (ack) { return ack({ success: false, message: `Room not found for this id: ${roomId}` }); }
        }
    });

    socket.on("chat:delivered", ({ messageId, roomId }, ack) => {
        if (roomId && activeRooms.has(roomId)) {
            io.to(roomId).emit("chat:delivered", { messageId });
            if (ack) { return ack({ success: true }); }
        } else {
            console.log(`Room has expired (id: ${roomId}) other ids in room : ${JSON.stringify(activeRooms)}`);
            if (ack) { return ack({ success: false, message: `Room not found for this id: ${roomId}` }); }
        }
    });

    socket.on("chat:seen", ({ messageId, roomId }, ack) => {
        if (roomId && activeRooms.has(roomId)) {
            io.to(roomId).emit("chat:seen", { messageId });
            if (ack) { return ack({ success: true }); }
        } else {
            console.log(`Room has expired (id: ${roomId}) other ids in room : ${JSON.stringify(activeRooms)}`);
            if (ack) { return ack({ success: false, message: `Room not found for this id: ${roomId}` }); }
        }
    });

    socket.on("chat:timerStarts", ({ roomId }, ack) => {
        if (roomId && activeRooms.has(roomId)) {
            const startedAt = Date.now();
            timers[roomId] = startedAt;
            io.to(roomId).emit("chat:timerStarted", { startedAt });
            if (ack) { return ack({ success: true }); }
        } else {
            console.log(`Room has expired (id: ${roomId}) other ids in room : ${JSON.stringify(activeRooms)}`);
            if (ack) { return ack({ success: false, message: `Room not found for this id: ${roomId}` }); }
        }
    });
}