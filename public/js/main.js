const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");

// Get username and room from URL
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

console.log(`Attempting to join with username: ${username}, room: ${room}`);

// Socket initialization that works better with Render
const socket = io({
  transports: ["websocket", "polling"],
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  timeout: 20000,
  autoConnect: true,
});

// Connection status indicators
socket.on("connect", () => {
  console.log("Connected to server with ID:", socket.id);

  // Only attempt to join room when successfully connected
  socket.emit("joinRoom", { username, room });

  // Hide any previous connection error message
  const errorMsg = document.getElementById("connection-error");
  if (errorMsg) errorMsg.style.display = "none";
});

// Get room and users
socket.on("roomUsers", ({ room, users }) => {
  console.log("Room users received:", { room, users });
  outputRoomName(room);
  outputUsers(users);
});

// Message from server
socket.on("message", (message) => {
  console.log("Message received:", message);
  outputMessage(message);

  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Message submit
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // Get message text
  let msg = e.target.elements.msg.value;

  msg = msg.trim();

  if (!msg) {
    return false;
  }

  // Emit message to server
  socket.emit("chatMessage", msg);

  // Clear input
  e.target.elements.msg.value = "";
  e.target.elements.msg.focus();
});

// Output message to DOM
function outputMessage(message) {
  const div = document.createElement("div");
  div.classList.add("message");
  const p = document.createElement("p");
  p.classList.add("meta");
  p.innerText = message.username;
  p.innerHTML += `<span>${message.time}</span>`;
  div.appendChild(p);
  const para = document.createElement("p");
  para.classList.add("text");
  para.innerText = message.text;
  div.appendChild(para);
  document.querySelector(".chat-messages").appendChild(div);
}

// Add room name to DOM
function outputRoomName(room) {
  roomName.innerText = room;
}

// Add users to DOM
function outputUsers(users) {
  userList.innerHTML = "";
  users.forEach((user) => {
    const li = document.createElement("li");
    li.innerText = user.username;
    userList.appendChild(li);
  });
}

// Prompt the user before leave chat room
document.getElementById("leave-btn").addEventListener("click", () => {
  const leaveRoom = confirm("Are you sure you want to leave the chatroom?");
  if (leaveRoom) {
    // Disconnect socket before navigating
    socket.disconnect();
    window.location = "/";
  }
});

// Enhanced error handling
socket.on("connect_error", (error) => {
  console.error("Connection Error:", error);

  // Create an error message if it doesn't exist
  if (!document.getElementById("connection-error")) {
    const errorDiv = document.createElement("div");
    errorDiv.id = "connection-error";
    errorDiv.style.backgroundColor = "#f8d7da";
    errorDiv.style.color = "#721c24";
    errorDiv.style.padding = "10px";
    errorDiv.style.marginBottom = "15px";
    errorDiv.style.borderRadius = "5px";
    errorDiv.style.textAlign = "center";
    errorDiv.innerText =
      "Failed to connect to the chat server. Attempting to reconnect...";

    // Insert at the top of the chat messages area
    chatMessages.insertBefore(errorDiv, chatMessages.firstChild);
  }
});

socket.on("reconnect", (attemptNumber) => {
  console.log(`Reconnected after ${attemptNumber} attempts`);

  // Hide the error message if it exists
  const errorMsg = document.getElementById("connection-error");
  if (errorMsg) errorMsg.style.display = "none";
});

socket.on("reconnect_failed", () => {
  console.error("Failed to reconnect after multiple attempts");

  // Update the error message
  const errorMsg = document.getElementById("connection-error");
  if (errorMsg) {
    errorMsg.innerText =
      "Connection lost. Please refresh the page to try again.";
  }
});
