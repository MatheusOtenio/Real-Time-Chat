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

// Initialize Socket.IO with CORS and Render-friendly configuration
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
  path: "/socket.io/",
  // Increase ping timeout for cloud environments
  pingTimeout: 60000,
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

// Bot name for system messages
const botName = "ChatMO Bot";

// Routes to ensure pages are served correctly
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/chat.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});

// Improved error handling for routes
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "public", "index.html"));
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("New socket connection established:", socket.id);

  // Handle user joining a room
  socket.on("joinRoom", ({ username, room }) => {
    console.log(`User ${username} attempting to join room ${room}`);

    if (!username || !room) {
      console.error("Missing username or room");
      return;
    }

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
    } else {
      console.error("Message received from unknown user");
    }
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
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

  // Additional error handling
  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

// Port configuration
const PORT = process.env.PORT || 3000;

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// For Render, we need to export the app
module.exports = app;
