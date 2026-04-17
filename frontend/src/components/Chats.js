import React, { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import Navbar from "./Navbar";
import { baseUrl } from "../Urls";
import "./Chat.css";

function Chats() {
  const socket = useMemo(() => io(`${baseUrl}`), []);
  const [message, setMessage] = useState("");
  const [room, setRoom] = useState("");
  const [chats, setChats] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [users, setUsers] = useState([]);
  const [roomMessages, setRoomMessages] = useState([]);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchCurrentUser();
    const savedRoom = localStorage.getItem("currentRoom");
    if (savedRoom) {
      setRoom(savedRoom);
      fetchChatHistory(savedRoom);
    }

    socket.on("connect", () => {
      if (savedRoom) {
        socket.emit("join-room", {
          room: savedRoom,
          username: localStorage.getItem("chatUsername") || "User",
        });
      }
    });

    socket.on("receive-message", (data) => {
      setChats((prevChats) => [...prevChats, data]);
    });

    socket.on("update-user-status", (onlineUsers) => {
      setUsers(onlineUsers);
    });

    socket.on("room-activity", (data) => {
      setRoomMessages((prevMessages) => [...prevMessages, data]);
    });

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  useEffect(() => {
    if (currentUser && currentUser.username) {
      localStorage.setItem("chatUsername", currentUser.username);
      socket.emit("user-connected", {
        username: currentUser.username,
        badgeId: currentUser.badgeId,
      });
      // Re-join if room was already set from localStorage
      if (room) {
        socket.emit("join-room", {
          room: room,
          username: currentUser.username,
        });
      }
    }
  }, [currentUser, socket, room]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && room.trim()) {
      const newMessage = {
        message,
        room,
        username: currentUser.username,
        socketId: socket.id,
      };
      socket.emit("message", newMessage);
      setMessage("");
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/user/current`, {
        credentials: "include",
      });
      const data = await response.json();
      setCurrentUser(data.user);
    } catch (err) {
      setError(`Failed to load user: ${err.message}`);
    }
  };

  const fetchChatHistory = async (roomName) => {
    try {
      const response = await fetch(`${baseUrl}/api/chat/history/${roomName}`, {
        credentials: "include",
      });
      const data = await response.json();
      if (data.messages) {
        setChats(data.messages);
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
  };

  const handleRoomSubmit = (e) => {
    e.preventDefault();
    if (roomName.trim()) {
      localStorage.setItem("currentRoom", roomName);
      socket.emit("join-room", {
        room: roomName,
        username: currentUser.username,
      });
      setRoom(roomName);
      fetchChatHistory(roomName);
      setRoomName("");
    }
  };

  const leaveRoom = () => {
    localStorage.removeItem("currentRoom");
    setRoom("");
    setChats([]);
  };

  const insertMathSymbol = (symbol) => {
    setMessage((prevMessage) => prevMessage + symbol);
  };

  return (
    <>
      <Navbar />
      <div className="math-chat">
      <header className="chat-header">
        <h1>Instant MathChat {room && <span className="current-room-title">| Room: {room} <button className="leave-room-btn" onClick={leaveRoom}>Leave</button></span>}</h1>
      </header>

      <div className="chat-container">
        <div className="sidebar">
          <div className="room-form">
            <h5>Create or Join Room to start instant chat</h5>
            <form onSubmit={handleRoomSubmit}>
              <input
                placeholder="Room Name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
              />
              <button type="submit">Join Room</button>
            </form>
          </div>

          <div className="online-users">
            <h3>Online Users</h3>
            <ul>
              {users.length > 0 ? (
                users.map((user, index) => {
                  let badgeSymbol = "";
                  let badgeClass = "";
                  switch (user.badgeId ? user.badgeId.position : "") {
                    case "Beginner":
                      badgeSymbol = "🌱";
                      badgeClass = "beginner-badge";
                      break;
                    case "Rookie":
                      badgeSymbol = "🪖";
                      badgeClass = "rookie-badge";
                      break;
                    case "Intermediate":
                      badgeSymbol = "🎖️";
                      badgeClass = "intermediate-badge";
                      break;
                    case "Expert":
                      badgeSymbol = "⭐";
                      badgeClass = "expert-badge";
                      break;
                    default:
                      break;
                  }

                  return (
                    <li key={index}>
                      <span>{user.username}</span>
                      <span className={`badge ${badgeClass}`}>
                        {badgeSymbol} {user.badgeId?.position}
                      </span>
                    </li>
                  );
                })
              ) : (
                <li>No users online</li>
              )}
            </ul>
          </div>

          <div className="room-messages">
            <h3>Room Activity</h3>
            <ul>
              {roomMessages.map((msg, index) => (
                <li key={index}>
                  {msg.username} joined room: {msg.room}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="chat-main">
          <div className="chat-messages">
            {chats.length > 0 ? (
              chats.map((chat, index) => (
                <div
                  key={index}
                  className={`message ${
                    chat.username === currentUser?.username ? "sent" : "received"
                  }`}
                >
                  <div className="message-header">
                    <span className="username">{chat.username}</span>
                    <span className="timestamp">
                      {chat.createdAt ? new Date(chat.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p>{chat.message}</p>
                </div>
              ))
            ) : (
              <p className="no-messages">No messages yet</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="message-form">
            <input
              placeholder="Type your mathematical message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button type="submit">Send</button>
          </form>
          <div className="math-keyboard">
            {[
              "+",
              "-",
              "×",
              "÷",
              "=",
              "≠",
              "≈",
              "√",
              "π",
              "∑",
              "∫",
              "∞",
            ].map((symbol) => (
              <button key={symbol} onClick={() => insertMathSymbol(symbol)}>
                {symbol}
              </button>
            ))}
          </div>
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      </div>
    </>
  );
}

export default Chats;
