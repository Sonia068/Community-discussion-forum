const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const discussionRoutes = require("./routes/discussionRoutes");
const commentRoutes = require("./routes/commentRoutes");
const messageRoutes = require("./routes/messageRoutes");
const chatSocket = require("./sockets/chatSocket");

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// routes
app.use("/api/auth", authRoutes);
app.use("/api/discussions", discussionRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/messages", messageRoutes);

// base route
app.get("/", (req, res) => {
  res.send("Server is running");
});

// initialize socket chat handlers
chatSocket(io);

// connect to database then start server
connectDB().then(() => {
  server.listen(process.env.PORT, () => {
    console.log("Server running on port " + process.env.PORT);
  });
}).catch((error) => {
  console.log("Failed to start server: " + error.message);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.log("Port " + process.env.PORT + " is already in use. Change the PORT in .env file.");
    process.exit(1);
  }
});