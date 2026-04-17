import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import userRoutes from "./routes/users-routes.js";
import questionRoutes from "./routes/questions-routes.js";
import answerRoutes from "./routes/answers-routes.js";
import aiRoutes from "./routes/ai-routes.js";
import notificationRoutes from "./routes/notifications-routes.js";
import HttpError from "./models/http-error.js";
import commentRoutes from "./routes/comments-routes.js";
import Message from "./models/message.js";
import cors from "cors";
const app = express();
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import { createServer } from "http";
import bodyParser from "body-parser";

// Initialize HTTP server and Socket.IO
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://math-craft-ruddy.vercel.app"],
    credentials: true,
  },
});

app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: ['http://localhost:3000', 'https://math-craft-ruddy.vercel.app'], // Allow both localhost and production
  credentials: true // Allow cookies to be sent
}));

// Attach Socket.io instance to request
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/api/user", userRoutes);
app.use("/api/question", questionRoutes);
app.use("/api/answer/", answerRoutes);
app.use("/api/comment/", commentRoutes);
app.use("/api/ai/", aiRoutes);
app.use("/api/notifications/", notificationRoutes);

// Realtime chat users map
const users = {};
// User ID to Socket ID map for targeted notifications
const userSocketMap = {};

io.on("connection", (socket) => {
  // Event to handle user connection and storing the user data
  socket.on("user-connected", (user) => {
    users[socket.id] = { username: user.username, badgeId: user.badgeId, userId: user._id };
    if (user._id) {
      userSocketMap[user._id] = socket.id;
    }
    io.emit("update-user-status", Object.values(users));
  });

  // When a user disconnects, remove them from the maps
  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (user && user.userId) {
      delete userSocketMap[user.userId];
    }
    delete users[socket.id];
    io.emit("update-user-status", Object.values(users));
  });

  // Handle joining specific user room for notifications
  socket.on("join-notifications", (userId) => {
    socket.join(`notifications-${userId}`);
  });

  // Event for sending messages to a specific room
  socket.on("message", async ({ message, room, username, socketId }) => {
    try {
      const newMessage = new Message({
        room,
        username,
        message,
        socketId
      });
      await newMessage.save();
      io.to(room).emit("receive-message", { message, username, socketId });
    } catch (err) {
      console.error("Error saving message:", err);
    }
  });

  // Event to join a room
  socket.on("join-room", ({ room, username }) => {
    socket.join(room);
    io.emit("room-activity", { username, room });
  });

  socket.on("room-created", (msg) => {
    io.emit("room-created", msg);
  });
});

app.get('/api/chat/history/:room', async (req, res, next) => {
  const room = req.params.room;
  try {
    const messages = await Message.find({ room }).sort({ createdAt: 1 }).limit(50);
    res.json({ messages });
  } catch (err) {
    const error = new HttpError("Fetching chat history failed.", 500);
    return next(error);
  }
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


  
