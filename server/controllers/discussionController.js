const Discussion = require("../models/Discussion");

// POST /api/discussions
// create a new discussion - requires login
const createDiscussion = async (req, res) => {
  try {
    const { title, body, category, tags } = req.body;

    if (!title || !body) {
      return res.status(400).json({ message: "Title and body are required" });
    }

    const discussion = await Discussion.create({
      title,
      body,
      category: category || "general",
      tags: tags || [],
      author: req.user.id,
    });

    // populate author details before sending response
    await discussion.populate("author", "username avatar");

    return res.status(201).json({
      message: "Discussion created successfully",
      discussion,
    });
  } catch (error) {
    console.log("Create discussion error: " + error.message);
    return res.status(500).json({ message: "Server error while creating discussion" });
  }
};

// GET /api/discussions
// get all discussions with optional filters
const getAllDiscussions = async (req, res) => {
  try {
    const { category, tag, search, page, limit } = req.query;

    // build a filter object based on query params
    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (tag) {
      filter.tags = { $in: [tag] };
    }

    if (search) {
      // search in title and body using regex
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { body: { $regex: search, $options: "i" } },
      ];
    }

    // pagination setup
    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * pageSize;

    const totalDiscussions = await Discussion.countDocuments(filter);

    const discussions = await Discussion.find(filter)
      .populate("author", "username avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    return res.status(200).json({
      discussions,
      totalDiscussions,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalDiscussions / pageSize),
    });
  } catch (error) {
    console.log("Get discussions error: " + error.message);
    return res.status(500).json({ message: "Server error while fetching discussions" });
  }
};

// GET /api/discussions/:id
// get a single discussion by its id
const getDiscussionById = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id).populate(
      "author",
      "username avatar bio"
    );

    if (!discussion) {
      return res.status(404).json({ message: "Discussion not found" });
    }

    // increment view count every time someone opens the discussion
    discussion.views = discussion.views + 1;
    await discussion.save();

    return res.status(200).json({ discussion });
  } catch (error) {
    console.log("Get discussion error: " + error.message);
    return res.status(500).json({ message: "Server error while fetching discussion" });
  }
};

// PUT /api/discussions/:id
// update a discussion - only the author can do this
const updateDiscussion = async (req, res) => {
  try {
    const { title, body, category, tags } = req.body;

    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({ message: "Discussion not found" });
    }

    // check if the logged in user is the author of this discussion
    if (discussion.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only edit your own discussions" });
    }

    // update only the fields that were provided
    if (title) discussion.title = title;
    if (body) discussion.body = body;
    if (category) discussion.category = category;
    if (tags) discussion.tags = tags;

    await discussion.save();
    await discussion.populate("author", "username avatar");

    return res.status(200).json({
      message: "Discussion updated successfully",
      discussion,
    });
  } catch (error) {
    console.log("Update discussion error: " + error.message);
    return res.status(500).json({ message: "Server error while updating discussion" });
  }
};

// DELETE /api/discussions/:id
// delete a discussion - only the author or admin can do this
const deleteDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({ message: "Discussion not found" });
    }

    // allow delete if user is the author or if user is an admin
    if (discussion.author.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "You are not allowed to delete this discussion" });
    }

    await Discussion.findByIdAndDelete(req.params.id);

    return res.status(200).json({ message: "Discussion deleted successfully" });
  } catch (error) {
    console.log("Delete discussion error: " + error.message);
    return res.status(500).json({ message: "Server error while deleting discussion" });
  }
};

// POST /api/discussions/:id/vote
// upvote or remove vote from a discussion
const voteDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({ message: "Discussion not found" });
    }

    const userId = req.user.id;
    const alreadyVoted = discussion.votedBy.includes(userId);

    if (alreadyVoted) {
      // remove the vote if user already voted
      discussion.votedBy = discussion.votedBy.filter(
        (id) => id.toString() !== userId
      );
      discussion.votes = discussion.votes - 1;
    } else {
      // add the vote
      discussion.votedBy.push(userId);
      discussion.votes = discussion.votes + 1;
    }

    await discussion.save();

    return res.status(200).json({
      message: alreadyVoted ? "Vote removed" : "Vote added",
      votes: discussion.votes,
    });
  } catch (error) {
    console.log("Vote discussion error: " + error.message);
    return res.status(500).json({ message: "Server error while voting" });
  }
};

module.exports = {
  createDiscussion,
  getAllDiscussions,
  getDiscussionById,
  updateDiscussion,
  deleteDiscussion,
  voteDiscussion,
};