import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import userRoutes from "./routes/users-routes.js";
import questionRoutes from "./routes/questions-routes.js";
import answerRoutes from "./routes/answers-routes.js";
import HttpError from "./models/http-error.js";
import commentRoutes from "./routes/comments-routes.js";
import cors from "cors";
const app = express();
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
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

// Initialize HTTP server and Socket.IO before starting to listen
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://math-craft-ruddy.vercel.app"],
    credentials: true,
  },
});

// Realtime chat users map
const users = {};

io.on("connection", (socket) => {
  // Event to handle user connection and storing the user data
  socket.on("user-connected", (user) => {
    users[socket.id] = { username: user.username, badgeId: user.badgeId };
    io.emit("update-user-status", Object.values(users));
  });

  // Event for sending messages to a specific room
  socket.on("message", ({ message, room, username, socketId }) => {
    io.to(room).emit("receive-message", { message, username, socketId });
  });

  // Event to join a room
  socket.on("join-room", ({ room, username }) => {
    socket.join(room);
    io.emit("room-activity", { username, room });
  });

  socket.on("room-created", (msg) => {
    io.emit("room-created", msg);
  });

  // When a user disconnects, remove them from the users object
  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("update-user-status", Object.values(users));
  });
});

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
    const PORT = process.env.PORT || 5001;
    console.log(`Running at localhost://${PORT}`);
    console.log("Mongodb connected successfully");
    server.listen(PORT);
  })
  .catch((err) => {
    console.log(err);
  });


  
