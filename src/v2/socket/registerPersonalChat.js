export function registerPersonalChatHandlers(io, socket) {
    io.on("onPersonalChat", () => {
        socket.on("join", (userId) => {
            socket.join(userId);
        });

        socket.on("send-message", ({ senderId, receiverId, text }) => {
            io.to(receiverId).emit("receive-message", { senderId, text });
        });
    });
}