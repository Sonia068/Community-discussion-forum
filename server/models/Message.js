const mongoose = require("mongoose");

// a message is sent in the real time chat inside a discussion room
const messageSchema = new mongoose.Schema(
  {
    // the text content of the message
    text: {
      type: String,
      required: true,
      trim: true,
    },
    // who sent this message
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // which discussion room this message belongs to
    // each discussion has its own chat room
    room: {
      type: String,
      required: true,
    },
    // username stored directly so we dont need to populate every time
    senderName: {
      type: String,
      required: true,
    },
    senderAvatar: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Message", messageSchema);