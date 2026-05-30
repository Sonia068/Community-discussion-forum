import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/layout/Navbar";
import toast from "react-hot-toast";

const CreateDiscussion = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    body: "",
    category: "general",
    tags: "",
  });

  const [loading, setLoading] = useState(false);

  const categories = ["general", "tech", "help", "announcements", "offtopic"];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.body) {
      toast.error("Title and body are required");
      return;
    }

    if (formData.title.length < 10) {
      toast.error("Title must be at least 10 characters");
      return;
    }

    if (formData.body.length < 20) {
      toast.error("Body must be at least 20 characters");
      return;
    }

    // convert comma separated tags string into an array
    const tagsArray = formData.tags
      ? formData.tags.split(",").map((tag) => tag.trim()).filter((tag) => tag)
      : [];

    setLoading(true);

    try {
      const res = await api.post("/discussions", {
        title: formData.title,
        body: formData.body,
        category: formData.category,
        tags: tagsArray,
      });

      toast.success("Discussion created successfully");
      navigate("/discussion/" + res.data.discussion._id);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to create discussion";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Start a Discussion</h1>
          <p className="text-gray-500 text-sm mt-1">
            Ask a question or share something with the community
          </p>
        </div>

        {/* form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Write a clear and descriptive title"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Minimum 10 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Body
              </label>
              <textarea
                name="body"
                value={formData.body}
                onChange={handleChange}
                placeholder="Describe your topic in detail..."
                rows={8}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Minimum 20 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white capitalize"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="capitalize">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="nodejs, javascript, react (comma separated)"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Separate tags with commas
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg text-sm transition duration-200 disabled:opacity-60"
              >
                {loading ? "Posting..." : "Post Discussion"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium px-6 py-2 rounded-lg text-sm transition duration-200"
              >
                Cancel
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

export default CreateDiscussion;