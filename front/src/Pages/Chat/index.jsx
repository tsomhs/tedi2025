import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./Chat.module.css";
import axios from "axios";

function ChatPage() {
  const { chatId } = useParams(); // actual chat ID (optional for new chat)
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [currentChatId, setCurrentChatId] = useState(chatId || null);

  // Load user info
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserId(res.data.user.id);
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

  // Determine the other participant user ID
  const getOtherUserId = () => {
    const msg = messages.find(
      (m) => m.from_user !== userId || m.to_user !== userId
    );
    if (msg) return msg.from_user === userId ? msg.to_user : msg.from_user;
    return null;
  };

  // Send new message
  const handleSend = async () => {
    const otherUser = getOtherUserId();
    if (!newMessage.trim() || !otherUser) {
      alert("Cannot send message: no recipient.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      // Include chat_id if it exists
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
      setCurrentChatId(sentMessage.chat_id); // store chat_id for future messages

      setMessages((prev) => [...prev, sentMessage]);
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // Delete a message
  const handleDelete = async (messageId) => {
    console.log("Deleting message ID:", messageId);
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
        <h2>Chat</h2>
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
