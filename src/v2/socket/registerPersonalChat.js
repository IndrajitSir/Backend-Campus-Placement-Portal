export function registerPersonalChatHandlers(io, socket) {
    socket.on("join", (userId) => {
        socket.join(userId);
    });

    socket.on("send-message", ({ senderId, receiverId, text, ciphertexts, keyVersion }) => {
        const cleanText = text?.trim?.() || "";
        if (!senderId || !receiverId || !cleanText) {
            if (ciphertexts && ciphertexts.toSender && ciphertexts.toReceiver) {
                // E2EE path: relay envelopes
                io.to(receiverId).emit("receive-message", {
                    senderId,
                    ciphertexts,
                    keyVersion: Number.isInteger(keyVersion) && keyVersion >= 1 ? keyVersion : 1,
                    encrypted: true,
                });
                return;
            }
            return;
        }

        io.to(receiverId).emit("receive-message", { senderId, text: cleanText });
    });
}