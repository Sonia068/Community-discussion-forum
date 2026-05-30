const mongoose = require("mongoose");

// a discussion is like a forum thread/post created by a user
const discussionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
    },
    // which user created this discussion
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // category helps organize discussions by topic
    category: {
      type: String,
      enum: ["general", "tech", "help", "announcements", "offtopic"],
      default: "general",
    },
    tags: {
      type: [String],
      default: [],
    },
    // how many people upvoted this discussion
    votes: {
      type: Number,
      default: 0,
    },
    // array of user ids who voted so they cant vote twice
    votedBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    // how many views this discussion has received
    views: {
      type: Number,
      default: 0,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Discussion", discussionSchema);