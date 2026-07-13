let onlineUsers = new Map();
const User =
require("../models/User");

const socketHandler = (io) => {

    io.on("connection", (socket) => {

        console.log("User Connected:", socket.id);

        // USER ONLINE
       socket.on(
    "join",
    async (userId) => {

        onlineUsers.set(
            userId,
            socket.id
        );

        await User.findByIdAndUpdate(
            userId,
            {
                isOnline: true
            }
        );

        io.emit(
            "onlineUsers",
            Array.from(
                onlineUsers.keys()
            )
        );

    }
);

        // SEND MESSAGE
        socket.on("sendMessage", (message) => {

            const receiverSocketId =
                onlineUsers.get(
                    message.receiver
                );

            if (receiverSocketId) {

                io.to(receiverSocketId)
                    .emit(
                        "receiveMessage",
                        message
                    );

            }

        });

        // TYPING
        socket.on(
            "typing",
            ({ receiver, sender }) => {

                const receiverSocketId =
                    onlineUsers.get(receiver);

                if (receiverSocketId) {

                    io.to(receiverSocketId)
                        .emit(
                            "typing",
                            sender
                        );

                }

            }
        );

        // STOP TYPING
        socket.on(
            "stopTyping",
            ({ receiver, sender }) => {

                const receiverSocketId =
                    onlineUsers.get(receiver);

                if (receiverSocketId) {

                    io.to(receiverSocketId)
                        .emit(
                            "stopTyping",
                            sender
                        );

                }

            }
        // DELETE MESSAGE
        socket.on(
            "deleteMessage",
            ({ messageId, receiver }) => {
                const receiverSocketId = onlineUsers.get(receiver);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("messageDeleted", messageId);
                }
            }
        );

        // UPDATE MESSAGE
        socket.on(
            "updateMessage",
            ({ message, receiver }) => {
                const receiverSocketId = onlineUsers.get(receiver);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("messageUpdated", message);
                }
            }
        );

        socket.on(
    "disconnect",
    async () => {

        for (
            let [userId, socketId]
            of onlineUsers
        ) {

            if (
                socketId === socket.id
            ) {

                onlineUsers.delete(
                    userId
                );

                await User.findByIdAndUpdate(
                    userId,
                    {
                        isOnline: false,
                        lastSeen: new Date()
                    }
                );

                break;
            }
        }

        io.emit(
            "onlineUsers",
            Array.from(
                onlineUsers.keys()
            )
        );

    }
);

socket.on(
    "messageSeen",
    ({ messageId, sender }) => {

        const senderSocketId =
            onlineUsers.get(sender);

        if (senderSocketId) {

            io.to(senderSocketId)
                .emit(
                    "messageSeen",
                    messageId
                );

        }

    }
);

    });

};

module.exports = socketHandler;