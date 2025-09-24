import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getOwnInfo } from "../../axios/auth";
import axios from "axios";
import styles from "./Messages.module.css";

function MessagingPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("inbox");
  const [inbox, setInbox] = useState([]);
  const [sent, setSent] = useState([]);
  const [newMessagesCount, setNewMessagesCount] = useState(0);

  const token = localStorage.getItem("token"); // adjust if using context or redux

  const fetchMessages = async () => {
    try {
      const [inboxRes, sentRes, unreadRes] = await Promise.all([
        axios.get("http://localhost:5000/api/messages/inbox", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/messages/sent", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/messages/unread-count", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setInbox(inboxRes.data.inbox);
      setSent(sentRes.data.sent);
      setNewMessagesCount(unreadRes.data.unreadCount);

      console.log(inboxRes);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const refreshMessages = async () => {
    await fetchMessages();
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const openChat = (chat) => {
    // Use chat_id instead of user ID
    if (!chat.chat_id) {
      console.error("No chat_id available for this message");
      return;
    }
    navigate(`/chat/${chat.chat_id}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1>Messages</h1>
      </div>
      {newMessagesCount > 0 && (
        <p className={styles.newMsgIndicator}>
          {newMessagesCount} new message{newMessagesCount > 1 ? "s" : ""}
        </p>
      )}

      <div className={styles.tabs}>
        <button
          className={activeTab === "inbox" ? styles.activeTab : ""}
          onClick={() => setActiveTab("inbox")}
        >
          Inbox
        </button>
        <button
          className={activeTab === "sent" ? styles.activeTab : ""}
          onClick={() => setActiveTab("sent")}
        >
          Sent
        </button>
        <button className={styles.refreshBtn} onClick={refreshMessages}>
          Refresh
        </button>
      </div>

      <div className={styles.chatList}>
        {((activeTab === "inbox" ? inbox : sent) || []).length === 0 ? (
          <p className={styles.emptyMsg}>No messages.</p>
        ) : (
          ((activeTab === "inbox" ? inbox : sent) || []).map((chat) => (
            <div
              key={chat.id}
              className={`${styles.chatItem} ${
                activeTab === "inbox" && !chat.is_read ? styles.newChat : ""
              }`}
              onClick={() => openChat(chat)}
            >
              <div className={styles.chatHeader}>
                <span className={styles.chatUser}>
                  {activeTab === "inbox"
                    ? chat.sender_username
                    : chat.recipient_username}
                </span>
                <span className={styles.chatTime}>
                  {new Date(chat.sent_at).toLocaleString()}
                </span>
              </div>
              <div className={styles.chatSnippet}>
                {chat.body?.slice(0, 60)}...
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MessagingPage;
