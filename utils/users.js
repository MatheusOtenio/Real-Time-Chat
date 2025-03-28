const users = [];

// Join user to chat
function userJoin(id, username, room) {
  // Validate inputs
  if (!id || !username || !room) {
    console.error("Invalid user join parameters");
    return null;
  }

  // Check if username already exists in room
  const existingUser = users.find(
    (user) =>
      user.username.toLowerCase() === username.toLowerCase() &&
      user.room === room
  );

  if (existingUser) {
    // Append a number to make username unique
    username = `${username}_${users.filter((u) => u.room === room).length + 1}`;
  }

  const user = { id, username, room };
  users.push(user);

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
    return users.splice(index, 1)[0];
  }
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
