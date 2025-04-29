import { registerChatHandlers } from "./registerChatHandlers.js";
import { registerInterviewHandlers } from "./registerInterviewHandlers.js";
import { registerLogHandlers, logView } from "./registerLogHandlers.js";
export function setupSocket(io) {
    io.on("connection", (socket) => {
        const role = socket.handshake.query.role;
        if (role === "admin" || role === "super_admin") {
            socket.join("admin-room");
            console.log("Admin connected: ", socket.id);
            io.in("admin-room").fetchSockets().then(sockets => {
                console.log("Sockets in admin-room:", sockets.map(s => s.id));
            });
            socket.on("log:requestView", () => {
                logView(socket);
            });
        } else {
            console.log("Client (Non-Admin) connected: ", socket.id);
        }
        registerInterviewHandlers(io, socket);
        registerChatHandlers(io, socket);
        registerLogHandlers(io, socket);
        socket.on("error", (err) => {
            console.error("Socket error: ", err);
        });
        socket.on("disconnect", () => {
            console.log("client disconnected: ", socket.id);
        });
    });
}