const jwt = require("jsonwebtoken");

// this middleware checks if the request has a valid JWT token
// we will use this on any route that requires the user to be logged in
const protect = (req, res, next) => {
  try {
    // check if authorization header exists
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided, access denied" });
    }

    // extract the token from "Bearer <token>"
    const token = authHeader.split(" ")[1];

    // verify the token using our secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // attach the decoded user info to the request object
    // now any route using this middleware can access req.user
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = { protect };