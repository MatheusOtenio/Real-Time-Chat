const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");

// Get username and room from URL
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

console.log(`Attempting to join with username: ${username}, room: ${room}`);

// Improved socket initialization with error handling
const socket = io({
  transports: ["websocket", "polling"],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000,
});

// Join chatroom when connected
socket.on("connect", () => {
  console.log("Socket connected with ID:", socket.id);
  socket.emit("joinRoom", { username, room });
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
    // Fix: Use absolute path instead of relative path
    window.location = "/index.html";
  }
});

// Enhanced error handling
socket.on("connect_error", (error) => {
  console.error("Connection Error:", error);
  alert("Failed to connect to the chat server. Please try again later.");
});

socket.on("reconnect_attempt", (attemptNumber) => {
  console.log(`Attempting to reconnect (${attemptNumber})...`);
});

socket.on("reconnect_failed", () => {
  console.error("Failed to reconnect after multiple attempts");
  alert("Connection lost. Please refresh the page to try again.");
});
