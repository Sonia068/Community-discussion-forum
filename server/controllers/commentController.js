const Comment = require("../models/Comment");
const Discussion = require("../models/Discussion");

// POST /api/comments
// create a new comment on a discussion
const createComment = async (req, res) => {
  try {
    const { body, discussionId, parentComment } = req.body;

    if (!body) {
      return res.status(400).json({ message: "Comment body is required" });
    }

    if (!discussionId) {
      return res.status(400).json({ message: "Discussion id is required" });
    }

    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({ message: "Discussion not found" });
    }

    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (!parent) {
        return res.status(404).json({ message: "Parent comment not found" });
      }
    }

    const comment = await Comment.create({
      body,
      discussion: discussionId,
      author: req.user.id,
      parentComment: parentComment || null,
    });

    await comment.populate("author", "username avatar");

    return res.status(201).json({
      message: "Comment posted successfully",
      comment,
    });
  } catch (error) {
    console.log("Create comment error: " + error.message);
    return res.status(500).json({ message: "Server error while posting comment" });
  }
};

// GET /api/comments/:discussionId
// get all comments for a specific discussion
const getCommentsByDiscussion = async (req, res) => {
  try {
    const { discussionId } = req.params;

    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({ message: "Discussion not found" });
    }

    // get only top level comments first
    const comments = await Comment.find({
      discussion: discussionId,
      parentComment: null,
    })
      .populate("author", "username avatar")
      .sort({ createdAt: 1 });

    // for each top level comment get its replies
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parentComment: comment._id })
          .populate("author", "username avatar")
          .sort({ createdAt: 1 });

        const commentObj = comment.toObject();
        commentObj.replies = replies;
        return commentObj;
      })
    );

    return res.status(200).json({ comments: commentsWithReplies });
  } catch (error) {
    console.log("Get comments error: " + error.message);
    return res.status(500).json({ message: "Server error while fetching comments" });
  }
};

// PUT /api/comments/:id
// update a comment - only the author can do this
const updateComment = async (req, res) => {
  try {
    const { body } = req.body;

    if (!body) {
      return res.status(400).json({ message: "Comment body is required" });
    }

    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only edit your own comments" });
    }

    comment.body = body;
    await comment.save();
    await comment.populate("author", "username avatar");

    return res.status(200).json({
      message: "Comment updated successfully",
      comment,
    });
  } catch (error) {
    console.log("Update comment error: " + error.message);
    return res.status(500).json({ message: "Server error while updating comment" });
  }
};

// DELETE /api/comments/:id
// delete a comment - author or admin can do this
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.author.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "You are not allowed to delete this comment" });
    }

    // also delete all replies to this comment
    await Comment.deleteMany({ parentComment: req.params.id });
    await Comment.findByIdAndDelete(req.params.id);

    return res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.log("Delete comment error: " + error.message);
    return res.status(500).json({ message: "Server error while deleting comment" });
  }
};

// POST /api/comments/:id/vote
// vote on a comment
const voteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const userId = req.user.id;
    const alreadyVoted = comment.votedBy.includes(userId);

    if (alreadyVoted) {
      comment.votedBy = comment.votedBy.filter(
        (id) => id.toString() !== userId
      );
      comment.votes = comment.votes - 1;
    } else {
      comment.votedBy.push(userId);
      comment.votes = comment.votes + 1;
    }

    await comment.save();

    return res.status(200).json({
      message: alreadyVoted ? "Vote removed" : "Vote added",
      votes: comment.votes,
    });
  } catch (error) {
    console.log("Vote comment error: " + error.message);
    return res.status(500).json({ message: "Server error while voting on comment" });
  }
};

module.exports = {
  createComment,
  getCommentsByDiscussion,
  updateComment,
  deleteComment,
  voteComment,
};