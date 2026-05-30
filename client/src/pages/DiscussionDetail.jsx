import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/layout/Navbar";
import { useAuth } from "../context/AuthContext";
import socket from "../services/socket";
import toast from "react-hot-toast";

const DiscussionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [discussion, setDiscussion] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentBody, setCommentBody] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [loadingDiscussion, setLoadingDiscussion] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);

  // chat state
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const [chatJoined, setChatJoined] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // fetch discussion details
  useEffect(() => {
    const fetchDiscussion = async () => {
      try {
        const res = await api.get("/discussions/" + id);
        setDiscussion(res.data.discussion);
      } catch (error) {
        toast.error("Discussion not found");
        navigate("/");
      } finally {
        setLoadingDiscussion(false);
      }
    };

    fetchDiscussion();
  }, [id]);

  // fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await api.get("/comments/" + id);
        setComments(res.data.comments);
      } catch (error) {
        toast.error("Failed to load comments");
      } finally {
        setLoadingComments(false);
      }
    };

    fetchComments();
  }, [id]);

  // setup socket connection when component mounts
  useEffect(() => {
    if (!user) return;

    // connect the socket
    socket.connect();

    // join the discussion room
    socket.emit("joinRoom", {
      roomId: id,
      userId: user._id,
      username: user.username,
      avatar: user.avatar || "",
    });

    setChatJoined(true);

    // listen for previous messages
    socket.on("previousMessages", (msgs) => {
      setMessages(msgs);
    });

    // listen for new incoming messages
    socket.on("newMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // listen for online users updates
    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    // listen for typing indicators
    socket.on("userTyping", (data) => {
      if (data.username !== user.username) {
        setTypingUser(data.username);
      }
    });

    socket.on("userStopTyping", () => {
      setTypingUser("");
    });

    // listen for user joined notifications
    socket.on("userJoined", (data) => {
      setMessages((prev) => [
        ...prev,
        { _id: Date.now(), isSystem: true, text: data.message },
      ]);
    });

    // listen for user left notifications
    socket.on("userLeft", (data) => {
      setMessages((prev) => [
        ...prev,
        { _id: Date.now() + 1, isSystem: true, text: data.message },
      ]);
    });

    // cleanup when user leaves the page
    return () => {
      socket.emit("leaveRoom", { roomId: id, username: user.username });
      socket.off("previousMessages");
      socket.off("newMessage");
      socket.off("onlineUsers");
      socket.off("userTyping");
      socket.off("userStopTyping");
      socket.off("userJoined");
      socket.off("userLeft");
      socket.disconnect();
    };
  }, [id, user]);

  // scroll to bottom whenever new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    socket.emit("sendMessage", {
      roomId: id,
      text: messageText.trim(),
      userId: user._id,
      username: user.username,
      avatar: user.avatar || "",
    });

    setMessageText("");
    socket.emit("stopTyping", { roomId: id });
  };

  const handleMessageKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = (e) => {
    setMessageText(e.target.value);

    socket.emit("typing", { roomId: id, username: user.username });

    // clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // stop typing after 2 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { roomId: id });
    }, 2000);
  };

  const handleVote = async () => {
    try {
      const res = await api.post("/discussions/" + id + "/vote");
      setDiscussion((prev) => ({ ...prev, votes: res.data.votes }));
      toast.success(res.data.message);
    } catch (error) {
      toast.error("Failed to vote");
    }
  };

  const handleDeleteDiscussion = async () => {
    if (!window.confirm("Are you sure you want to delete this discussion?")) return;

    try {
      await api.delete("/discussions/" + id);
      toast.success("Discussion deleted");
      navigate("/");
    } catch (error) {
      toast.error("Failed to delete discussion");
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();

    if (!commentBody.trim()) {
      toast.error("Please write something");
      return;
    }

    setSubmittingComment(true);

    try {
      const res = await api.post("/comments", {
        body: commentBody,
        discussionId: id,
      });

      // add new comment to the top of the list with empty replies
      const newComment = { ...res.data.comment, replies: [] };
      setComments((prev) => [...prev, newComment]);
      setCommentBody("");
      toast.success("Comment posted");
    } catch (error) {
      toast.error("Failed to post comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handlePostReply = async (e, parentCommentId) => {
    e.preventDefault();

    if (!replyBody.trim()) {
      toast.error("Please write something");
      return;
    }

    try {
      const res = await api.post("/comments", {
        body: replyBody,
        discussionId: id,
        parentComment: parentCommentId,
      });

      // add reply to the correct parent comment
      setComments((prev) =>
        prev.map((comment) => {
          if (comment._id === parentCommentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), res.data.comment],
            };
          }
          return comment;
        })
      );

      setReplyBody("");
      setReplyingTo(null);
      toast.success("Reply posted");
    } catch (error) {
      toast.error("Failed to post reply");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;

    try {
      await api.delete("/comments/" + commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      toast.success("Comment deleted");
    } catch (error) {
      toast.error("Failed to delete comment");
    }
  };

  const handleVoteComment = async (commentId) => {
    try {
      const res = await api.post("/comments/" + commentId + "/vote");
      setComments((prev) =>
        prev.map((comment) => {
          if (comment._id === commentId) {
            return { ...comment, votes: res.data.votes };
          }
          return comment;
        })
      );
    } catch (error) {
      toast.error("Failed to vote");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loadingDiscussion) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <p className="text-gray-400">Loading discussion...</p>
        </div>
      </div>
    );
  }

  if (!discussion) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* left column - discussion and comments */}
        <div className="lg:col-span-2 space-y-6">

          {/* discussion card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">

            {/* category and tags */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full capitalize">
                {discussion.category}
              </span>
              {discussion.tags && discussion.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* title */}
            <h1 className="text-xl font-bold text-gray-800 mb-3">
              {discussion.title}
            </h1>

            {/* author and date */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <span className="font-medium text-gray-700">
                {discussion.author?.username}
              </span>
              <span>•</span>
              <span>{formatDate(discussion.createdAt)}</span>
              <span>•</span>
              <span>{discussion.views} views</span>
            </div>

            {/* body */}
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
              {discussion.body}
            </p>

            {/* actions */}
            <div className="flex items-center gap-4 mt-5 pt-4 border-t border-gray-100">
              <button
                onClick={handleVote}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition duration-200"
              >
                <span className="text-base">▲</span>
                <span>{discussion.votes} votes</span>
              </button>

              {user && discussion.author?._id === user._id && (
                <button
                  onClick={handleDeleteDiscussion}
                  className="text-sm text-red-400 hover:text-red-600 transition duration-200 ml-auto"
                >
                  Delete Discussion
                </button>
              )}
            </div>

          </div>

          {/* comments section */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              Comments ({comments.length})
            </h2>

            {/* post a comment */}
            <form onSubmit={handlePostComment} className="mb-6">
              <textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <button
                type="submit"
                disabled={submittingComment}
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition duration-200 disabled:opacity-60"
              >
                {submittingComment ? "Posting..." : "Post Comment"}
              </button>
            </form>

            {/* comments list */}
            {loadingComments ? (
              <p className="text-gray-400 text-sm">Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className="text-gray-400 text-sm">
                No comments yet. Be the first to comment.
              </p>
            ) : (
              <div className="space-y-5">
                {comments.map((comment) => (
                  <div key={comment._id}>

                    {/* main comment */}
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
                        {comment.author?.username?.[0]?.toUpperCase()}
                      </div>

                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-xl px-4 py-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-800">
                              {comment.author?.username}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{comment.body}</p>
                        </div>

                        {/* comment actions */}
                        <div className="flex items-center gap-4 mt-1 px-1">
                          <button
                            onClick={() => handleVoteComment(comment._id)}
                            className="text-xs text-gray-500 hover:text-blue-600"
                          >
                            ▲ {comment.votes}
                          </button>

                          <button
                            onClick={() =>
                              setReplyingTo(
                                replyingTo === comment._id ? null : comment._id
                              )
                            }
                            className="text-xs text-gray-500 hover:text-blue-600"
                          >
                            Reply
                          </button>

                          {user && comment.author?._id === user._id && (
                            <button
                              onClick={() => handleDeleteComment(comment._id)}
                              className="text-xs text-red-400 hover:text-red-600"
                            >
                              Delete
                            </button>
                          )}
                        </div>

                        {/* reply form */}
                        {replyingTo === comment._id && (
                          <form
                            onSubmit={(e) => handlePostReply(e, comment._id)}
                            className="mt-2"
                          >
                            <textarea
                              value={replyBody}
                              onChange={(e) => setReplyBody(e.target.value)}
                              placeholder={"Reply to " + comment.author?.username + "..."}
                              rows={2}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                            <div className="flex gap-2 mt-1">
                              <button
                                type="submit"
                                className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700"
                              >
                                Post Reply
                              </button>
                              <button
                                type="button"
                                onClick={() => setReplyingTo(null)}
                                className="text-xs text-gray-500 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        )}

                        {/* replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-100">
                            {comment.replies.map((reply) => (
                              <div key={reply._id} className="flex gap-3">
                                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-600 shrink-0">
                                  {reply.author?.username?.[0]?.toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <div className="bg-gray-50 rounded-xl px-3 py-2">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-medium text-gray-800">
                                        {reply.author?.username}
                                      </span>
                                      <span className="text-xs text-gray-400">
                                        {formatDate(reply.createdAt)}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700">{reply.body}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

        {/* right column - real time chat */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 sticky top-20">

            {/* chat header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">
                Live Chat
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {onlineUsers.length} online
              </p>
            </div>

            {/* online users */}
            {onlineUsers.length > 0 && (
              <div className="px-4 py-2 border-b border-gray-100 flex flex-wrap gap-1">
                {onlineUsers.map((u) => (
                  <span
                    key={u.userId}
                    className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1"
                  >
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
                    {u.username}
                  </span>
                ))}
              </div>
            )}

            {/* messages area */}
            <div className="h-72 overflow-y-auto px-4 py-3 space-y-2">
              {messages.length === 0 ? (
                <p className="text-xs text-gray-400 text-center mt-8">
                  No messages yet. Say hello!
                </p>
              ) : (
                messages.map((msg) => (
                  <div key={msg._id}>
                    {msg.isSystem ? (
                      <p className="text-xs text-gray-400 text-center italic">
                        {msg.text}
                      </p>
                    ) : (
                      <div
                        className={`flex flex-col ${
                          msg.senderName === user?.username ? "items-end" : "items-start"
                        }`}
                      >
                        <span className="text-xs text-gray-400 mb-0.5">
                          {msg.senderName}
                        </span>
                        <div
                          className={`px-3 py-2 rounded-xl text-sm max-w-xs break-words ${
                            msg.senderName === user?.username
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* typing indicator */}
            <div className="px-4 h-5">
              {typingUser && (
                <p className="text-xs text-gray-400 italic">
                  {typingUser} is typing...
                </p>
              )}
            </div>

            {/* message input */}
            <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
              <input
                type="text"
                value={messageText}
                onChange={handleTyping}
                onKeyDown={handleMessageKeyDown}
                placeholder="Type a message..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendMessage}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2 rounded-lg transition duration-200"
              >
                Send
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default DiscussionDetail;