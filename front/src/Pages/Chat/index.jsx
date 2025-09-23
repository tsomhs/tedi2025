import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./Chat.module.css";
import axios from "axios";

function ChatPage() {
  const { chatId } = useParams(); // now it's actual chat ID
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [userId, setUserId] = useState(null);

  // Load user ID
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

  useEffect(() => {
    const container = document.querySelector(`.${styles.messagesContainer}`);
    container.scrollTop = container.scrollHeight;
  }, [messages]);

  // Load chat messages from backend
  useEffect(() => {
    const loadChat = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `http://localhost:5000/api/messages/chat/${chatId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessages(res.data.messages || []);
        console.log(res.data);
      } catch (err) {
        console.error("Error loading chat:", err);
      } finally {
        setLoading(false);
      }
    };
    loadChat();
  }, [chatId]);

  // Send new message
  const handleSend = async () => {
    if (!newMessage.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/messages",
        {
          chat_id: chatId, // send chat_id now
          body: newMessage,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Optimistically add to UI
      const newMsgObj = {
        id: Date.now(),
        from_user: "me",
        chat_id: chatId,
        text: newMessage,
        time: new Date().toISOString(),
        fromMe: true,
      };

      setMessages((prev) => [...prev, newMsgObj]);
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
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
        ) : messages.length > 0 ? (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.message} ${
                msg.from_user === userId ? styles.fromMe : styles.fromThem
              }`}
            >
              <p>{msg.body || msg.text}</p>
              <span className={styles.time}>
                {new Date(msg.sent_at || msg.time).toLocaleString()}
              </span>
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
