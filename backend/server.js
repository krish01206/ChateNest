const http = require("http");

const app = require("./app");

const { Server } = require("socket.io");

const socketHandler =
    require("./sockets/socket");

const PORT =
    process.env.PORT || 5000;

const server =
    http.createServer(app);

const io = new Server(server, {

    cors: {
  origin: [
    "http://localhost:5173",
    "https://chatnest-backend.onrender.com",
  ],
  credentials: true,
}

});

socketHandler(io);

server.listen(PORT, () => {

    console.log(
        `Server running on port ${PORT}`
    );

});