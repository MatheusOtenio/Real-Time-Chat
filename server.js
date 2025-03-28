const path = require("path");
const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");

const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, "public")));

const botName = "ChatCord Bot";

// Rotas adicionais para garantir que as páginas sejam servidas
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/chat.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});

// Socket.IO configuration
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    setTimeout(() => {
      socket.emit("message", formatMessage(botName, "Welcome!")); // Primeira mensagem após 2 segundos
      setTimeout(() => {
        socket.emit(
          "message",
          formatMessage(
            botName,
            "This is a chat for discussions and learning about programming languages, with each room dedicated to a different language. Let's learn together!"
          )
        ); // Segunda mensagem após mais 2 segundos
      }, 2000);
    }, 2000);

    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });
});

// Exportar para Vercel
module.exports = server;
