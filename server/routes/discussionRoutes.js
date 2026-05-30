const express = require("express");
const router = express.Router();
const {
  createDiscussion,
  getAllDiscussions,
  getDiscussionById,
  updateDiscussion,
  deleteDiscussion,
  voteDiscussion,
} = require("../controllers/discussionController");
const { protect } = require("../middleware/authMiddleware");

// public routes - anyone can view discussions
router.get("/", getAllDiscussions);
router.get("/:id", getDiscussionById);

// protected routes - must be logged in
router.post("/", protect, createDiscussion);
router.put("/:id", protect, updateDiscussion);
router.delete("/:id", protect, deleteDiscussion);
router.post("/:id/vote", protect, voteDiscussion);

module.exports = router;