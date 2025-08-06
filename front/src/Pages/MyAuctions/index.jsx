import React, { useState, useEffect } from "react";
import styles from "./MyAuctions.module.css";
import auctionData from "../../constants/auctions";

function MyAuctions() {
  const [auctions, setAuctions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newAuction, setNewAuction] = useState({
    name: "",
    firstBid: "",
    currently: "",
    buyPrice: "",
    categories: "",
    description: "",
    location: "",
    country: "",
  });
  const [notification, setNotification] = useState({ message: "", type: "" });

  useEffect(() => {
    // Always load from static auction data
    setAuctions(auctionData);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAuction((prev) => ({ ...prev, [name]: value }));
  };
  const handleCreateAuction = async () => {
    const { name, firstBid, buyPrice, ends } = newAuction;
    if (!name || !firstBid || !buyPrice || !ends) {
      setShowModal(false);
      setNotification({
        message: "Please fill in all required fields.",
        type: "error",
      });
      setTimeout(() => setNotification({ message: "", type: "" }), 3000);
      return;
    }

    const auction = {
      ...newAuction,
      id: Date.now(),
      categories: newAuction.categories.split(",").map((c) => c.trim()),
      firstBid: parseFloat(newAuction.firstBid),
      currently: 0,
      buyPrice: parseFloat(newAuction.buyPrice),
      numberOfBids: 0,
      started: new Date().toLocaleString(),
      ends: newAuction.ends,
      status: "Pending",
      seller: { userID: "you", rating: 0 },
      bids: [],
    };

    // This is temporary and does NOT affect the backend
    setAuctions((prev) => [...prev, auction]);

    setShowModal(false);
    setNotification({
      message: "Auction created successfully!",
      type: "success",
    });
    setTimeout(() => setNotification({ message: "", type: "" }), 3000);

    setNewAuction({
      name: "",
      firstBid: "",
      currently: "",
      buyPrice: "",
      categories: "",
      description: "",
      location: "",
      country: "",
    });

    // await AddAuction(auction); // Placeholder
  };

  /*
  // 🔧 Placeholder for backend integration later
  async function AddAuction(auctionData) {
    // Send POST request to backend API to create a new auction
    // Example:
    // await fetch("/api/auctions", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(auctionData),
    // });
  }
  */

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>My Auctions</h1>
      <button
        className={styles.newAuctionBtn}
        onClick={() => setShowModal(true)}
      >
        + New Auction
      </button>

      {notification.message && (
        <div
          className={`${styles.notification} ${
            notification.type === "error" ? styles.error : styles.success
          }`}
        >
          {notification.message}
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Create New Auction</h2>
            <input
              type="text"
              name="name"
              placeholder="Auction Name"
              value={newAuction.name}
              onChange={handleInputChange}
            />
            <input
              type="number"
              name="firstBid"
              placeholder="Starting Price"
              value={newAuction.firstBid}
              onChange={handleInputChange}
            />

            <input
              type="number"
              name="buyPrice"
              placeholder="Buy Price"
              value={newAuction.buyPrice}
              onChange={handleInputChange}
            />
            <input
              type="datetime-local"
              name="ends"
              placeholder="End"
              value={newAuction.ends}
              onChange={handleInputChange}
            />

            <input
              type="text"
              name="categories"
              placeholder="Categories (comma separated)"
              value={newAuction.categories}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="location"
              placeholder="Location"
              value={newAuction.location}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="country"
              placeholder="Country"
              value={newAuction.country}
              onChange={handleInputChange}
            />
            <textarea
              name="description"
              placeholder="Description"
              value={newAuction.description}
              onChange={handleInputChange}
            />
            <div className={styles.modalButtons}>
              <button
                onClick={handleCreateAuction}
                className={styles.createBtn}
              >
                Create
              </button>
              <button
                onClick={() => setShowModal(false)}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.auctionList}>
        {auctions.map((item) => (
          <div key={item.id} className={styles.card}>
            <h2>{item.name}</h2>
            <p>
              <strong>Categories:</strong> {item.categories.join(", ")}
            </p>
            <p>
              <strong>Starting Price:</strong> {item.firstBid}
            </p>
            <p>
              <strong>Current Price:</strong> {item.currently}
            </p>
            <p>
              <strong>Buy Price:</strong> {item.buyPrice}
            </p>
            <p>
              <strong>Bids:</strong> {item.numberOfBids}
            </p>
            <p>
              <strong>Start:</strong> {item.started}
            </p>
            <p>
              <strong>End:</strong> {item.ends}
            </p>
            <p>
              <strong>Status:</strong> {item.status}
            </p>
            <p>
              <strong>Location:</strong> {item.location}
            </p>
            <p>
              <strong>Country:</strong> {item.country}
            </p>
            <p>
              <strong>Seller:</strong> {item.seller.userID} (Rating:{" "}
              {item.seller.rating})
            </p>
            <p>
              <strong>Description:</strong> {item.description}
            </p>

            <div className={styles.cardActions}>
              {item.status === "Pending" && (
                <>
                  {item.bids.length === 0 && (
                    <>
                      <button className={styles.edit}>Edit</button>
                      <button className={styles.delete}>Delete</button>
                    </>
                  )}
                  <button className={styles.start}>Start</button>
                </>
              )}
            </div>

            {item.bids?.length > 0 && (
              <div className={styles.bids}>
                <h3>Bids</h3>
                <ul>
                  {item.bids.map((bid, idx) => (
                    <li key={idx}>
                      {bid.amount} by {bid.bidder.userID} at {bid.time} from{" "}
                      {bid.bidder.country}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyAuctions;
