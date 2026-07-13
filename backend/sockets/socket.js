let onlineUsers = new Map(); // Maps userId -> Set of socket.ids
const User = require("../models/User");

const socketHandler = (io) => {
    io.on("connection", (socket) => {
        console.log("User Connected:", socket.id);

        // USER ONLINE
        socket.on("join", async (userId) => {
            if (!onlineUsers.has(userId)) {
                onlineUsers.set(userId, new Set());
            }
            onlineUsers.get(userId).add(socket.id);

            await User.findByIdAndUpdate(userId, { isOnline: true });

            io.emit("onlineUsers", Array.from(onlineUsers.keys()));
        });

        // SEND MESSAGE
        socket.on("sendMessage", (message) => {
            const receiverSocketIds = onlineUsers.get(message.receiver);
            if (receiverSocketIds) {
                receiverSocketIds.forEach((socketId) => {
                    io.to(socketId).emit("receiveMessage", message);
                });
            }
        });

        // TYPING
        socket.on("typing", ({ receiver, sender }) => {
            const receiverSocketIds = onlineUsers.get(receiver);
            if (receiverSocketIds) {
                receiverSocketIds.forEach((socketId) => {
                    io.to(socketId).emit("typing", sender);
                });
            }
        });

        // STOP TYPING
        socket.on("stopTyping", ({ receiver, sender }) => {
            const receiverSocketIds = onlineUsers.get(receiver);
            if (receiverSocketIds) {
                receiverSocketIds.forEach((socketId) => {
                    io.to(socketId).emit("stopTyping", sender);
                });
            }
        });

        // DELETE MESSAGE
        socket.on("deleteMessage", ({ messageId, receiver }) => {
            const receiverSocketIds = onlineUsers.get(receiver);
            if (receiverSocketIds) {
                receiverSocketIds.forEach((socketId) => {
                    io.to(socketId).emit("messageDeleted", messageId);
                });
            }
        });

        // UPDATE MESSAGE
        socket.on("updateMessage", ({ message, receiver }) => {
            const receiverSocketIds = onlineUsers.get(receiver);
            if (receiverSocketIds) {
                receiverSocketIds.forEach((socketId) => {
                    io.to(socketId).emit("messageUpdated", message);
                });
            }
        });

        // DISCONNECT
        socket.on("disconnect", async () => {
            let disconnectedUserId = null;
            for (let [userId, socketIds] of onlineUsers) {
                if (socketIds.has(socket.id)) {
                    socketIds.delete(socket.id);
                    if (socketIds.size === 0) {
                        onlineUsers.delete(userId);
                        disconnectedUserId = userId;
                    }
                    break;
                }
            }

            if (disconnectedUserId) {
                await User.findByIdAndUpdate(disconnectedUserId, {
                    isOnline: false,
                    lastSeen: new Date()
                });
            }

            io.emit("onlineUsers", Array.from(onlineUsers.keys()));
        });

        // MESSAGE SEEN
        socket.on("messageSeen", ({ messageId, sender }) => {
            const senderSocketIds = onlineUsers.get(sender);
            if (senderSocketIds) {
                senderSocketIds.forEach((socketId) => {
                    io.to(socketId).emit("messageSeen", messageId);
                });
            }
        });
    });
};

module.exports = socketHandler;