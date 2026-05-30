const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const { protect } = require("../middleware/authMiddleware");

// GET /api/messages/:roomId
// get chat history for a specific room
router.get("/:roomId", protect, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page } = req.query;

    const pageNumber = parseInt(page) || 1;
    const pageSize = 30;
    const skip = (pageNumber - 1) * pageSize;

    const messages = await Message.find({ room: roomId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    return res.status(200).json({
      messages: messages.reverse(),
      currentPage: pageNumber,
    });
  } catch (error) {
    console.log("Get messages error: " + error.message);
    return res.status(500).json({ message: "Server error while fetching messages" });
  }
});

// DELETE /api/messages/:id
// delete a single message - only sender can do this
router.delete("/:id", protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own messages" });
    }

    await Message.findByIdAndDelete(req.params.id);

    return res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.log("Delete message error: " + error.message);
    return res.status(500).json({ message: "Server error while deleting message" });
  }
});

module.exports = router;