const users = [];

// Join user to chat
function userJoin(id, username, room) {
  // Validate inputs
  if (!id || !username || !room) {
    console.error("Invalid user join parameters", { id, username, room });
    return null;
  }

  // Trim and sanitize inputs
  username = username.trim();
  room = room.trim();

  if (username === "" || room === "") {
    console.error("Empty username or room after trimming");
    return null;
  }

  // Check if user ID already exists (reconnection case)
  const existingUserById = users.find((user) => user.id === id);
  if (existingUserById) {
    // Remove the existing user entry (handles reconnections)
    userLeave(id);
  }

  // Check if username already exists in room
  const existingUser = users.find(
    (user) =>
      user.username.toLowerCase() === username.toLowerCase() &&
      user.room === room
  );

  if (existingUser) {
    // Create a unique username by adding a number suffix
    let counter = 1;
    let newUsername = `${username}_${counter}`;

    // Keep incrementing until we find a unique username
    while (
      users.find(
        (user) =>
          user.username.toLowerCase() === newUsername.toLowerCase() &&
          user.room === room
      )
    ) {
      counter++;
      newUsername = `${username}_${counter}`;
    }

    username = newUsername;
  }

  const user = { id, username, room };
  users.push(user);

  console.log(`User joined: ${username} in room ${room}`);
  return user;
}

// Get current user
function getCurrentUser(id) {
  return users.find((user) => user.id === id);
}

// User leaves chat
function userLeave(id) {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) {
    const user = users.splice(index, 1)[0];
    console.log(`User left: ${user.username} from room ${user.room}`);
    return user;
  }
  return null;
}

// Get room users
function getRoomUsers(room) {
  return users.filter((user) => user.room === room);
}

module.exports = {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
};
