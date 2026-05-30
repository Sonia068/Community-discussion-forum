import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* logo */}
        <Link to="/" className="text-xl font-bold text-blue-600">
          CommunityForum
        </Link>

        {/* right side */}
        <div className="flex items-center gap-4">

          {user ? (
            <>
              <Link
                to="/create"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition duration-200"
              >
                New Discussion
              </Link>

              <Link
                to="/profile"
                className="text-sm text-gray-700 hover:text-blue-600 font-medium"
              >
                {user.username}
              </Link>

              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-red-500 transition duration-200"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-gray-700 hover:text-blue-600 font-medium"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition duration-200"
              >
                Register
              </Link>
            </>
          )}

        </div>
      </div>
    </nav>
  );
};

export default Navbar;