const path = require("path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const formatMessage = require("./utils/messages");

const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

// Create Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with CORS configuration
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

// Bot name for system messages
const botName = "ChatCord Bot";

// Routes to ensure pages are served correctly
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/chat.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("New socket connection established");

  // Handle user joining a room
  socket.on("joinRoom", ({ username, room }) => {
    console.log(`User ${username} attempting to join room ${room}`);

    // Create user and add to room
    const user = userJoin(socket.id, username, room);

    if (!user) {
      console.error("Failed to join user to room");
      return;
    }

    // Join the room
    socket.join(user.room);

    // Welcome current user
    socket.emit(
      "message",
      formatMessage(botName, `Welcome to the ${room} room, ${username}!`)
    );

    // Broadcast to other users in the room that a new user has joined
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${username} has joined the chat`)
      );

    // Send updated room users information
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Handle chat messages
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);

    if (user) {
      io.to(user.room).emit("message", formatMessage(user.username, msg));
    }
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Update room users list after user leaves
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

// Port configuration
const PORT = process.env.PORT || 3000;

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export for Vercel
module.exports = app;
