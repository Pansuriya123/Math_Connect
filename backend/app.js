import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import userRoutes from "./routes/users-routes.js";
import questionRoutes from "./routes/questions-routes.js";
import answerRoutes from "./routes/answers-routes.js";
// import commentRoutes from "./routes/comments-routes.js";
import HttpError from "./models/http-error.js";
import commentRoutes from "./routes/comments-routes.js";
import cors from "cors";
const app = express();
import cookieParser from "cookie-parser";
// Auth-only mode: disable realtime/socket features
// import { Server } from "socket.io";
import { createServer } from "http";
import bodyParser from "body-parser";


app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: ['http://localhost:3000', 'https://math-craft-ruddy.vercel.app'], // Allow both localhost and production
  credentials: true // Allow cookies to be sent
}));
app.use("/api/user", userRoutes);
app.use("/api/question", questionRoutes);
app.use("/api/answer/", answerRoutes);
app.use("/api/comment/", commentRoutes);

app.get('/test-cookies', (req, res) => {
  console.log('Cookies:', req.cookies);  // Check if cookies are being parsed
  res.json({ cookies: req.cookies });
});

app.use(() => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});

app.use(express.json({ limit: '10mb' }));
//You can replace local server uri with MongoDB Atlas connection link
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Running at localhost://5000")
    console.log("Mongodb connected successfully")
    server.listen(5000);
  })
  .catch((err) => {
    console.log(err);
  });


// Sockets start..................
// const users = {}; // Object to store connected users

const server = createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: ["http://localhost:3000", "https://math-craft-ruddy.vercel.app"],
//     credentials: true,
//   },
// });
//
// io.on("connection", (socket) => {
//   console.log("User connected!");
//   console.log("Id: ", socket.id);
//
//   // Event to handle user connection and storing the user data
//   socket.on("user-connected", (user) => {
//     users[socket.id] = { username: user.username, badgeId: user.badgeId }; // Save user with badge info
//     io.emit("update-user-status", Object.values(users)); // Send updated users list to all clients
//     console.log(`${user.username} connected with ID: ${socket.id}, badge: ${user.badgeId.position}`);
//   });
//
//   // Event for sending messages to a specific room
//   socket.on("message", ({ message, room, username, socketId }) => {
//     io.to(room).emit("receive-message", { message, username, socketId });
//   });
//
//   // Event to join a room
//   socket.on("join-room", ({room,username}) => {
//     socket.join(room);
//     console.log(`${users[socket.id]} joined room: ${room}`);
//     io.emit('room-activity', { username, room });
//   });
//
//   socket.on("room-created", (msg) => {
//     // Broadcast the room creation message to all clients
//     io.emit("room-created", msg);
//   });
//
//   // When a user disconnects, remove them from the users object
//   socket.on("disconnect", () => {
//     console.log("Disconnected Id: ", socket.id);
//     delete users[socket.id]; // Remove the user from the online list
//     io.emit("update-user-status", Object.values(users)); // Update the online users list for all clients
//   });
// });
// Socket ends....................

  
