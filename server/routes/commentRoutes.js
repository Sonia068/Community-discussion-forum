const express = require("express");
const router = express.Router();
const {
  createComment,
  getCommentsByDiscussion,
  updateComment,
  deleteComment,
  voteComment,
} = require("../controllers/commentController");
const { protect } = require("../middleware/authMiddleware");

// public routes
router.get("/:discussionId", getCommentsByDiscussion);

// protected routes
router.post("/", protect, createComment);
router.put("/:id", protect, updateComment);
router.delete("/:id", protect, deleteComment);
router.post("/:id/vote", protect, voteComment);

module.exports = router;