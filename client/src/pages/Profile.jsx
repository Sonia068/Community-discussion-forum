import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/layout/Navbar";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [discussions, setDiscussions] = useState([]);
  const [loadingDiscussions, setLoadingDiscussions] = useState(true);
  const [activeTab, setActiveTab] = useState("discussions");

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || "",
    bio: user?.bio || "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // fetch all discussions created by the logged in user
  useEffect(() => {
    const fetchMyDiscussions = async () => {
      try {
        // we fetch all discussions and filter by author on frontend
        // this is fine for a student project
        const res = await api.get("/discussions?limit=100");
        const myDiscussions = res.data.discussions.filter(
          (d) => d.author?._id === user?._id
        );
        setDiscussions(myDiscussions);
      } catch (error) {
        toast.error("Failed to load your discussions");
      } finally {
        setLoadingDiscussions(false);
      }
    };

    if (user) {
      fetchMyDiscussions();
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (!formData.username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    setSavingProfile(true);

    try {
      // we will add this endpoint to the backend below
      await api.put("/auth/profile", {
        username: formData.username,
        bio: formData.bio,
      });

      toast.success("Profile updated successfully");
      setEditMode(false);

      // reload the page to reflect changes in navbar
      window.location.reload();
    } catch (error) {
      const message = error.response?.data?.message || "Failed to update profile";
      toast.error(message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* profile card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">

          {!editMode ? (
            // view mode
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">

                {/* avatar placeholder with first letter */}
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
                  {user.username?.[0]?.toUpperCase()}
                </div>

                <div>
                  <h1 className="text-xl font-bold text-gray-800">
                    {user.username}
                  </h1>
                  <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mt-1 inline-block capitalize">
                    {user.role}
                  </span>
                  {user.bio && (
                    <p className="text-sm text-gray-600 mt-2 max-w-md">
                      {user.bio}
                    </p>
                  )}
                </div>

              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setEditMode(true)}
                  className="text-sm border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition duration-200"
                >
                  Edit Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="text-sm border border-red-200 text-red-500 px-4 py-2 rounded-lg hover:bg-red-50 transition duration-200"
                >
                  Logout
                </button>
              </div>

            </div>
          ) : (
            // edit mode
            <form onSubmit={handleSaveProfile}>
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                Edit Profile
              </h2>

              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell the community about yourself"
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition duration-200 disabled:opacity-60"
                  >
                    {savingProfile ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="border border-gray-300 text-gray-600 text-sm px-5 py-2 rounded-lg hover:bg-gray-50 transition duration-200"
                  >
                    Cancel
                  </button>
                </div>

              </div>
            </form>
          )}

        </div>

        {/* stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {discussions.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Discussions</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {discussions.reduce((total, d) => total + d.votes, 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Total Votes</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {discussions.reduce((total, d) => total + d.views, 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Total Views</p>
          </div>
        </div>

        {/* tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("discussions")}
            className={`text-sm font-medium px-4 py-2 rounded-lg transition duration-200 ${
              activeTab === "discussions"
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            My Discussions
          </button>
          <button
            onClick={() => setActiveTab("account")}
            className={`text-sm font-medium px-4 py-2 rounded-lg transition duration-200 ${
              activeTab === "account"
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Account Info
          </button>
        </div>

        {/* tab content */}
        {activeTab === "discussions" && (
          <div className="space-y-3">
            {loadingDiscussions ? (
              <p className="text-gray-400 text-sm">Loading...</p>
            ) : discussions.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-gray-400">You have not created any discussions yet</p>
                <button
                  onClick={() => navigate("/create")}
                  className="mt-3 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Start your first discussion
                </button>
              </div>
            ) : (
              discussions.map((discussion) => (
                <div
                  key={discussion._id}
                  onClick={() => navigate("/discussion/" + discussion._id)}
                  className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-md transition duration-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full capitalize">
                        {discussion.category}
                      </span>
                      <h3 className="text-sm font-semibold text-gray-800 mt-1 truncate">
                        {discussion.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {discussion.body}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400 shrink-0 text-right">
                      <p>{formatDate(discussion.createdAt)}</p>
                      <p className="mt-1">{discussion.votes} votes</p>
                      <p>{discussion.views} views</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "account" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">
              Account Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Username</span>
                <span className="text-sm font-medium text-gray-800">
                  {user.username}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Email</span>
                <span className="text-sm font-medium text-gray-800">
                  {user.email}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Role</span>
                <span className="text-sm font-medium text-gray-800 capitalize">
                  {user.role}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500">Bio</span>
                <span className="text-sm font-medium text-gray-800">
                  {user.bio || "No bio added yet"}
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;