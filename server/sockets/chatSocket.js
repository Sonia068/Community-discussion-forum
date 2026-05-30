const Message = require("../models/Message");

// this function handles all socket events related to chat
// we pass the io instance from index.js into this function
const chatSocket = (io) => {
  // track online users in each room
  // key is roomId, value is array of user objects
  const onlineUsers = {};

  io.on("connection", (socket) => {
    console.log("User connected: " + socket.id);

    // when a user opens a discussion chat room
    // they emit joinRoom with their user info and the discussion id
    socket.on("joinRoom", async ({ roomId, userId, username, avatar }) => {
      // join the socket room
      socket.join(roomId);

      // store user info on the socket object for later use
      socket.userId = userId;
      socket.username = username;
      socket.avatar = avatar || "";
      socket.roomId = roomId;

      // add user to online users list for this room
      if (!onlineUsers[roomId]) {
        onlineUsers[roomId] = [];
      }

      // remove if already exists to avoid duplicates
      onlineUsers[roomId] = onlineUsers[roomId].filter(
        (user) => user.userId !== userId
      );

      onlineUsers[roomId].push({ userId, username, avatar: avatar || "" });

      // send the last 30 messages of this room to the user who just joined
      try {
        const previousMessages = await Message.find({ room: roomId })
          .sort({ createdAt: -1 })
          .limit(30)
          .lean();

        // reverse so oldest message shows first
        socket.emit("previousMessages", previousMessages.reverse());
      } catch (error) {
        console.log("Error fetching previous messages: " + error.message);
      }

      // tell everyone in the room who is currently online
      io.to(roomId).emit("onlineUsers", onlineUsers[roomId]);

      // tell everyone in the room that this user joined
      socket.to(roomId).emit("userJoined", {
        message: username + " joined the chat",
        username,
      });

      console.log(username + " joined room: " + roomId);
    });

    // when a user sends a message
    socket.on("sendMessage", async ({ roomId, text, userId, username, avatar }) => {
      if (!text || !text.trim()) {
        return;
      }

      try {
        // save the message to the database
        const message = await Message.create({
          text: text.trim(),
          sender: userId,
          room: roomId,
          senderName: username,
          senderAvatar: avatar || "",
        });

        const messageData = {
          _id: message._id,
          text: message.text,
          sender: userId,
          senderName: username,
          senderAvatar: avatar || "",
          room: roomId,
          createdAt: message.createdAt,
        };

        // broadcast the message to everyone in the room including sender
        io.to(roomId).emit("newMessage", messageData);
      } catch (error) {
        console.log("Error saving message: " + error.message);
        socket.emit("messageError", { message: "Failed to send message" });
      }
    });

    // when a user starts typing
    socket.on("typing", ({ roomId, username }) => {
      // tell everyone else in the room that this user is typing
      socket.to(roomId).emit("userTyping", { username });
    });

    // when a user stops typing
    socket.on("stopTyping", ({ roomId }) => {
      socket.to(roomId).emit("userStopTyping");
    });

    // when a user leaves a room manually
    socket.on("leaveRoom", ({ roomId, username }) => {
      socket.leave(roomId);

      // remove from online users
      if (onlineUsers[roomId]) {
        onlineUsers[roomId] = onlineUsers[roomId].filter(
          (user) => user.userId !== socket.userId
        );
      }

      // tell everyone in the room this user left
      io.to(roomId).emit("onlineUsers", onlineUsers[roomId] || []);
      socket.to(roomId).emit("userLeft", {
        message: username + " left the chat",
        username,
      });
    });

    // when user disconnects from the entire app
    socket.on("disconnect", () => {
      console.log("User disconnected: " + socket.id);

      const roomId = socket.roomId;

      if (roomId && onlineUsers[roomId]) {
        // remove from online users list
        onlineUsers[roomId] = onlineUsers[roomId].filter(
          (user) => user.userId !== socket.userId
        );

        // update everyone in the room
        io.to(roomId).emit("onlineUsers", onlineUsers[roomId]);

        if (socket.username) {
          socket.to(roomId).emit("userLeft", {
            message: socket.username + " left the chat",
            username: socket.username,
          });
        }
      }
    });
  });
};

module.exports = chatSocket;