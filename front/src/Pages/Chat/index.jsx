import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./Chat.module.css";
import axios from "axios";
import { getUserById } from "../../axios/auth";

function ChatPage() {
  const { chatId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [otherUserName, setOtherUserName] = useState(null);
  const [currentChatId, setCurrentChatId] = useState(chatId || null);

  // Load current user info
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserId(res.data.user.id);
      } catch (err) {
        console.error("Failed to fetch current user:", err);
      }
    };
    fetchUser();
  }, []);

  // Load chat messages if chatId exists
  useEffect(() => {
    if (!currentChatId) {
      setLoading(false);
      return;
    }

    const loadChat = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `http://localhost:5000/api/messages/chat/${currentChatId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessages(res.data.messages || []);
      } catch (err) {
        console.error("Error loading chat:", err);
      } finally {
        setLoading(false);
      }
    };
    loadChat();
  }, [currentChatId]);

  // Helper: find other participant’s user id
  const getOtherUserId = () => {
    if (!userId || !messages.length) return null;
    const msg = messages[0]; // first message is enough
    return msg.from_user === userId ? msg.to_user : msg.from_user;
  };

  // Fetch other participant’s name when messages/userId change
  useEffect(() => {
    const fetchOtherUser = async () => {
      if (!userId || !messages.length) return;
      const otherUserId = getOtherUserId();
      if (!otherUserId) return;

      try {
        const userData = await getUserById(otherUserId);
        // Adjust depending on your API response structure:
        // e.g., userData.username OR userData.user.username
        setOtherUserName(
          userData.username || userData.user?.username || "Unknown"
        );
      } catch (err) {
        console.error("Failed to fetch other user:", err);
      }
    };

    fetchOtherUser();
  }, [userId, messages]);

  // Send new message
  const handleSend = async () => {
    const otherUser = getOtherUserId();
    if (!newMessage.trim() || !otherUser) {
      alert("Cannot send message: no recipient.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const payload = {
        to_user: otherUser,
        body: newMessage,
      };
      if (currentChatId) payload.chat_id = currentChatId;

      const res = await axios.post(
        "http://localhost:5000/api/messages",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const sentMessage = res.data.message;
      setCurrentChatId(sentMessage.chat_id);
      setMessages((prev) => [...prev, sentMessage]);
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // Delete a message
  const handleDelete = async (messageId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h2>{otherUserName || "User not found"}</h2>
      </div>

      <div className={styles.messagesContainer}>
        {loading ? (
          <p>Loading...</p>
        ) : messages.length ? (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.message} ${
                msg.from_user === userId ? styles.fromMe : styles.fromThem
              }`}
            >
              <p>{msg.body}</p>
              <span className={styles.time}>
                {new Date(msg.sent_at).toLocaleString()}
              </span>
              {msg.from_user === userId && (
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(msg.id)}
                >
                  Delete
                </button>
              )}
            </div>
          ))
        ) : (
          <p className={styles.emptyMsg}>No messages yet</p>
        )}
      </div>

      <div className={styles.inputContainer}>
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

export default ChatPage;
