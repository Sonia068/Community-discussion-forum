import { io } from "socket.io-client";

// create a single socket instance for the entire app
const socket = io("http://localhost:5000", {
  autoConnect: false,
});

export default socket;