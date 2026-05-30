import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/layout/Navbar";
import toast from "react-hot-toast";

const Dashboard = () => {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const categories = ["general", "tech", "help", "announcements", "offtopic"];

  const fetchDiscussions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (search) params.append("search", search);
      if (category) params.append("category", category);
      params.append("page", currentPage);
      params.append("limit", 10);

      const res = await api.get("/discussions?" + params.toString());
      setDiscussions(res.data.discussions);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      toast.error("Failed to load discussions");
    } finally {
      setLoading(false);
    }
  };

  // fetch discussions when page loads or filters change
  useEffect(() => {
    fetchDiscussions();
  }, [category, currentPage]);

  // search with a small delay so we dont hit the api on every keystroke
  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentPage(1);
      fetchDiscussions();
    }, 500);

    return () => clearTimeout(timeout);
  }, [search]);

  const handleCategoryClick = (cat) => {
    setCategory(cat === category ? "" : cat);
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Community Discussions</h1>
            <p className="text-gray-500 text-sm mt-1">
              Browse, search, and join discussions
            </p>
          </div>
          <Link
            to="/create"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition duration-200"
          >
            New Discussion
          </Link>
        </div>

        {/* search bar */}
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search discussions..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        {/* category filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`text-xs font-medium px-3 py-1 rounded-full border transition duration-200 capitalize ${
                category === cat
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
              }`}
            >
              {cat}
            </button>
          ))}
          {category && (
            <button
              onClick={() => setCategory("")}
              className="text-xs font-medium px-3 py-1 rounded-full border border-red-300 text-red-500 hover:bg-red-50 transition duration-200"
            >
              Clear filter
            </button>
          )}
        </div>

        {/* discussions list */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            Loading discussions...
          </div>
        ) : discussions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">No discussions found</p>
            <p className="text-gray-400 text-sm mt-1">
              Be the first to start a discussion
            </p>
            <Link
              to="/create"
              className="inline-block mt-4 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Start Discussion
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {discussions.map((discussion) => (
              <Link
                to={"/discussion/" + discussion._id}
                key={discussion._id}
                className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition duration-200"
              >
                <div className="flex items-start justify-between gap-4">

                  {/* left side */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full capitalize">
                        {discussion.category}
                      </span>
                      {discussion.isPinned && (
                        <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                          Pinned
                        </span>
                      )}
                    </div>

                    <h2 className="text-base font-semibold text-gray-800 truncate">
                      {discussion.title}
                    </h2>

                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {discussion.body}
                    </p>

                    {/* tags */}
                    {discussion.tags && discussion.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {discussion.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* right side stats */}
                  <div className="flex flex-col items-end gap-1 text-xs text-gray-400 shrink-0">
                    <span>{formatDate(discussion.createdAt)}</span>
                    <span className="text-gray-500 font-medium">
                      by {discussion.author?.username}
                    </span>
                    <div className="flex items-center gap-3 mt-1">
                      <span>{discussion.votes} votes</span>
                      <span>{discussion.views} views</span>
                    </div>
                  </div>

                </div>
              </Link>
            ))}
          </div>
        )}

        {/* pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Previous
            </button>

            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;