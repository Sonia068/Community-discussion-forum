const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// helper function to generate a JWT token for a user
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // check if all fields are provided
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    // check if username is already taken
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username is already taken" });
    }

    // check if email is already registered
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    // hash the password before saving to database
    // 10 is the salt rounds - higher means more secure but slower
    const hashedPassword = await bcrypt.hash(password, 10);

    // create the new user in the database
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    // generate a token for the new user
    const token = generateToken(user._id);

    return res.status(201).json({
      message: "Account created successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.log("Register error: " + error.message);
    return res.status(500).json({ message: "Server error during registration" });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // check if both fields are provided
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    // find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // compare the provided password with the hashed password in database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // generate token
    const token = generateToken(user._id);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.log("Login error: " + error.message);
    return res.status(500).json({ message: "Server error during login" });
  }
};

// GET /api/auth/me
// protected route - returns the currently logged in user's data
const getMe = async (req, res) => {
  try {
    // req.user.id comes from the authMiddleware after token verification
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.log("GetMe error: " + error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/auth/profile
// update the logged in user's username and bio
const updateProfile = async (req, res) => {
  try {
    const { username, bio } = req.body;

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    // check if someone else already has this username
    const existing = await User.findOne({
      username,
      _id: { $ne: req.user.id },
    });

    if (existing) {
      return res.status(400).json({ message: "Username is already taken" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { username, bio: bio || "" },
      { new: true }
    ).select("-password");

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.log("Update profile error: " + error.message);
    return res.status(500).json({ message: "Server error while updating profile" });
  }
};

module.exports = { register, login, getMe, updateProfile };