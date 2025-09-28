import React, { useEffect, useState } from "react";
import styles from "./AuctionsBought.module.css";
import { getWonAuctions } from "../../axios/auth";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function AuctionsBought() {
  const navigate = useNavigate();

  const [wonAuctions, setWonAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal states
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messageRecipient, setMessageRecipient] = useState(null); // seller_id
  const [messageRecipientName, setMessageRecipientName] = useState("");

  useEffect(() => {
    async function fetchWon() {
      try {
        const data = await getWonAuctions();
        setWonAuctions(data);
        console.log(data);
      } catch (err) {
        console.error("Error fetching won auctions:", err);
        setError("Failed to load auctions");
      } finally {
        setLoading(false);
      }
    }
    fetchWon();
  }, []);

  const handleOpenMessageModal = (sellerId, sellerName) => {
    setMessageRecipient(sellerId);
    setMessageRecipientName(sellerName);
    setMessageText("");
    setShowMessageModal(true);
  };

  const handleCloseMessageModal = () => {
    setShowMessageModal(false);
    setMessageText("");
    setMessageRecipient(null);
    setMessageRecipientName("");
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !messageRecipient) {
      alert("Message cannot be empty!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const payload = {
        to_user: messageRecipient, // seller_id
        body: messageText,
      };

      const res = await axios.post(
        "http://localhost:5000/api/messages",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const sentMessage = res.data.message;

      //  Close modal and reset
      setShowMessageModal(false);
      setMessageText("");
      setMessageRecipient(null);

      //  Redirect into chat with this seller
      navigate(`/chat/${sentMessage.chat_id}`);
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message. Try again.");
    }
  };

  if (loading) return <div className={styles.loader}>Loading...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.header}>
        <span
          className={styles.backArrow}
          onClick={() => navigate("/browse", { replace: true })}
        >
          ←
        </span>
        <h2>My Won Auctions</h2>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.auctionTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Seller</th>
              <th>Final Price</th>
              <th>Ended</th>
              <th className={styles.actions}>Action</th>
            </tr>
          </thead>
          <tbody>
            {wonAuctions.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center" }}>
                  No auctions won yet
                </td>
              </tr>
            ) : (
              wonAuctions.map((auction) => (
                <tr key={auction.id}>
                  <td>{auction.name}</td>
                  <td>{auction.seller_name}</td>
                  <td>{auction.final_price}</td>
                  <td>{new Date(auction.ends).toLocaleString()}</td>
                  <td className={styles.buttons}>
                    <button
                      className={styles.info}
                      onClick={() => navigate(`/my-auctions/${auction.id}`)}
                    >
                      Info
                    </button>
                    <button
                      className={styles.messageBtn}
                      onClick={() =>
                        handleOpenMessageModal(
                          auction.seller_id,
                          auction.seller_name
                        )
                      }
                    >
                      Message Seller
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showMessageModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Message {messageRecipientName}</h2>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message here..."
              className={styles.textarea}
            />
            <div className={styles.modalButtons}>
              <button onClick={handleSendMessage}>Send</button>
              <button onClick={handleCloseMessageModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuctionsBought;
