import React, { useState, useEffect } from "react";
import styles from "./MyAuctions.module.css";
import { useNavigate } from "react-router-dom";
import auctionData from "../../constants/auctions";
import formatDate from "../../Utils/formatDate";

function MyAuctions() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Active"); // "Active" or "Pending"
  const [auctions, setAuctions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [newAuction, setNewAuction] = useState({
    name: "",
    firstBid: "",
    currently: "",
    buyPrice: "",
    categories: "",
    description: "",
    location: "",
    country: "",
    starts: "",
    ends: "",
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

  const handleEditAuction = () => {
    setAuctions((prevAuctions) =>
      prevAuctions.map((auction) =>
        auction.id === newAuction.id
          ? {
              ...newAuction,
              categories: newAuction.categories.split(",").map((c) => c.trim()),
              firstBid: parseFloat(newAuction.firstBid),
              buyPrice: parseFloat(newAuction.buyPrice),
              numberOfBids: auction.numberOfBids || 0, // keep existing bids count
              bids: auction.bids || [], // keep existing bids
              status: auction.status || "Pending",
              seller: auction.seller || { userID: "you", rating: 0 },
            }
          : auction
      )
    );

    setIsEditing(false);
    setShowModal(false);
    setNotification({
      message: "Auction updated successfully!",
      type: "success",
    });
    setTimeout(() => setNotification({ message: "", type: "" }), 3000);
  };

  const handleDeleteAuction = (id) => {
    setAuctions((prev) => prev.filter((auction) => auction.id !== id));
    setNotification({
      message: "Auction deleted successfully!",
      type: "success",
    });
    setTimeout(() => setNotification({ message: "", type: "" }), 3000);
  };

  const handleStartAuction = (id) => {
    setAuctions((prev) =>
      prev.map((auction) =>
        auction.id === id ? { ...auction, status: "Active" } : auction
      )
    );
    setNotification({
      message: "Auction started!",
      type: "success",
    });
    setTimeout(() => setNotification({ message: "", type: "" }), 3000);
  };

  const handleCreateAuction = async () => {
    const { name, firstBid, buyPrice, starts, ends } = newAuction;
    if (!name || !firstBid || !buyPrice || !starts || !ends) {
      setShowModal(false);
      setNotification({
        message: "Please fill in all required fields.",
        type: "error",
      });
      setTimeout(() => setNotification({ message: "", type: "" }), 3000);
      return;
    }

    if (starts >= ends) {
      setShowModal(false);
      setNotification({
        message: "Start date can't be later than end date.",
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
      currently: parseFloat(newAuction.firstBid), // Initially same as first bid
      buyPrice: parseFloat(newAuction.buyPrice),
      numberOfBids: 0,
      starts: newAuction.starts || new Date().toISOString(),
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
      starts: "",
      ends: "",
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

  const filteredAuctions = auctions.filter((a) => a.status === activeTab);

  return (
    <div className={styles.container}>
      <span className={styles.backArrow} onClick={() => navigate("/home")}>
        ←
      </span>

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

      {showModal && !isEditing && (
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
              placeholder="First Bid"
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
            <label>Start Date and Time</label>
            <input
              type="datetime-local"
              name="starts"
              placeholder="Starts"
              value={newAuction.starts}
              onChange={handleInputChange}
            />
            <label>End Date and Time</label>
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

      {!showModal && isEditing && (
        <div className={styles.editOverlay}>
          <div className={styles.editAuction}>
            <h2>Edit Auction</h2>
            <label>Auction Name</label>
            <input
              type="text"
              name="name"
              placeholder="Auction Name"
              value={newAuction.name}
              onChange={handleInputChange}
            />
            <label>First Bid</label>
            <input
              type="number"
              name="firstBid"
              placeholder="First Bid"
              value={newAuction.firstBid}
              onChange={handleInputChange}
            />
            <label>Buy Price</label>
            <input
              type="number"
              name="buyPrice"
              placeholder="Buy Price"
              value={newAuction.buyPrice}
              onChange={handleInputChange}
            />
            <label>Start Date and Time</label>
            <input
              type="datetime-local"
              name="starts"
              placeholder="Starts"
              value={newAuction.starts}
              onChange={handleInputChange}
            />
            <label>End Date and Time</label>
            <input
              type="datetime-local"
              name="ends"
              placeholder="End"
              value={newAuction.ends}
              onChange={handleInputChange}
            />
            <label>Categories</label>
            <input
              type="text"
              name="categories"
              placeholder="Categories (comma separated)"
              value={newAuction.categories}
              onChange={handleInputChange}
            />
            <label>Country</label>
            <input
              type="text"
              name="country"
              placeholder="Country"
              value={newAuction.country}
              onChange={handleInputChange}
            />
            <label>Location</label>
            <input
              type="text"
              name="location"
              placeholder="Location"
              value={newAuction.location}
              onChange={handleInputChange}
            />
            <label>Description</label>
            <textarea
              name="description"
              placeholder="Description"
              value={newAuction.description}
              onChange={handleInputChange}
            />
            <div className={styles.modalButtons}>
              <button
                onClick={() => {
                  handleEditAuction();
                  setNewAuction({
                    name: "",
                    firstBid: "",
                    currently: "",
                    buyPrice: "",
                    categories: "",
                    description: "",
                    location: "",
                    country: "",
                    starts: "",
                    ends: "",
                  });
                  setIsEditing(false);
                }}
                className={styles.createBtn}
              >
                Save changes
              </button>

              <button
                onClick={() => {
                  setIsEditing(false);
                  setNewAuction({
                    name: "",
                    firstBid: "",
                    currently: "",
                    buyPrice: "",
                    categories: "",
                    description: "",
                    location: "",
                    country: "",
                    starts: "",
                    ends: "",
                  });
                }}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${
            activeTab === "Active" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("Active")}
        >
          Active
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "Pending" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("Pending")}
        >
          Pending
        </button>
      </div>

      {/* Auctions List */}
      <div className={styles.auctionList}>
        {filteredAuctions.map((item) => (
          <AuctionCard
            key={item.id}
            item={item}
            onEdit={() => {
              setIsEditing(true);
              setNewAuction({
                ...item,
                categories: item.categories.join(", "),
              });
            }}
            onDelete={() => handleDeleteAuction(item.id)}
            onStart={() => handleStartAuction(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

function AuctionCard({ item, onEdit, onDelete, onStart }) {
  return (
    <div className={styles.card}>
      <h2>{item.name}</h2>
      <p>
        <strong>Categories: </strong> &nbsp;{item.categories.join(", ")}
      </p>
      <p>
        <strong>First Bid:</strong>&nbsp; {item.firstBid}
      </p>
      <p>
        <strong>Current Price: </strong>&nbsp; {item.currently}
      </p>
      <p>
        <strong>Buy Price: </strong>&nbsp; {item.buyPrice}
      </p>
      <p>
        <strong>Bids: </strong>&nbsp; {item.numberOfBids}
      </p>
      <p>
        <strong>Start: </strong> &nbsp;{formatDate(item.starts)}
      </p>
      <p>
        <strong>End: </strong>&nbsp; {formatDate(item.ends)}
      </p>
      <p>
        <strong>Location: </strong> &nbsp;{item.location}
      </p>
      <p>
        <strong>Country: </strong> &nbsp;{item.country}
      </p>
      <p>
        <strong>Seller: </strong>&nbsp; {item.seller.userID} (Rating:{" "}
        {item.seller.rating})
      </p>
      <p>
        <strong>Description: </strong> &nbsp;{item.description}
      </p>
      <div className={styles.cardActions}>
        {item.status === "Pending" && (
          <>
            {item.bids.length === 0 && (
              <>
                <button className={styles.edit} onClick={onEdit}>
                  Edit
                </button>
                <button className={styles.delete} onClick={onDelete}>
                  Delete
                </button>
              </>
            )}
            <button className={styles.start} onClick={onStart}>
              Start
            </button>
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
  );
}

export default MyAuctions;
