import React, { useEffect, useState } from "react";
import styles from "./Messages.module.css";

function MessagingPage() {
  const [activeTab, setActiveTab] = useState("inbox");
  const [inbox, setInbox] = useState([]);
  const [sent, setSent] = useState([]);
  const [newMessagesCount, setNewMessagesCount] = useState(0);

  // Load messages stub
  const loadMessages = async () => {
    console.log("Loading messages...");

    // Stub data
    const inboxData = [
      {
        id: 1,
        from: "Alice",
        text: "Hello!",
        time: new Date().toISOString(),
        isNew: true,
      },
      {
        id: 2,
        from: "Bob",
        text: "Are you available?",
        time: new Date().toISOString(),
        isNew: false,
      },
    ];

    const sentData = [
      {
        id: 1,
        to: "Charlie",
        text: "Yes, I am.",
        time: new Date().toISOString(),
      },
    ];

    setInbox(inboxData);
    setSent(sentData);
    setNewMessagesCount(inboxData.filter((m) => m.isNew).length);
  };

  const refreshMessages = async () => {
    console.log("Refreshing messages...");
    await loadMessages();
  };

  const deleteMessage = (id, type) => {
    console.log(`Delete message ${id} from ${type}`);
    if (type === "inbox") setInbox((prev) => prev.filter((m) => m.id !== id));
    else setSent((prev) => prev.filter((m) => m.id !== id));
  };

  useEffect(() => {
    loadMessages();
  }, []);

  return (
    <div className={styles.container}>
      <h1>Messaging</h1>
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

      <div className={styles.messagesList}>
        {(activeTab === "inbox" ? inbox : sent).map((msg) => (
          <div
            key={msg.id}
            className={`${styles.message} ${msg.isNew ? styles.newMsg : ""}`}
          >
            <p>
              {activeTab === "inbox" ? (
                <strong>From: {msg.from}</strong>
              ) : (
                <strong>To: {msg.to}</strong>
              )}
              <span className={styles.time}>
                {new Date(msg.time).toLocaleString()}
              </span>
            </p>
            <p>{msg.text}</p>
            <button
              className={styles.deleteBtn}
              onClick={() => deleteMessage(msg.id, activeTab)}
            >
              Delete
            </button>
          </div>
        ))}
        {(activeTab === "inbox" ? inbox : sent).length === 0 && (
          <p>No messages.</p>
        )}
      </div>
    </div>
  );
}

export default MessagingPage;
