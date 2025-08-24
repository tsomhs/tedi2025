import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllAuctions, getUserRole } from "../../axios/auth";
import styles from "./Browse.module.css";
import formatDate from "../../Utils/formatDate";
import axios from "axios";
import { placeBid } from "../../axios/auth";

function BrowseAuctions() {
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [role, setRole] = useState("");

  // Modal states
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [currentAuction, setCurrentAuction] = useState(null);
  const [bidError, setBidError] = useState("");

  useEffect(() => {
    const fetchRole = async () => {
      const res = await getUserRole();
      if (res.success) setRole(res.role);
    };
    fetchRole();
  }, []);

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const data = await getAllAuctions();
        console.log("Fetched auctions:", data);
        const mapped = data.auctions.map((a) => ({
          id: a.id,
          name: a.name,
          categories: a.categories || [],
          firstBid: a.first_bid,
          currently: a.currently,
          buyPrice: a.buy_price,
          starts: a.started,
          ends: a.ends,
          seller: { userID: a.seller_username, rating: a.seller_rating || 0 },
          bids: a.bids || [],
          description: a.description || "",
          location: a.location,
          country: a.country,
        }));
        setAuctions(mapped);
      } catch (err) {
        console.error("Failed to load auctions:", err);
      }
    };
    fetchAuctions();
  }, []);

  const totalPages = Math.ceil(auctions.length / itemsPerPage);
  const paginated = auctions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenBid = (auction) => {
    setBidError("");
    setCurrentAuction(auction);
    setShowBidModal(true);
  };
  const handleCloseBid = () => {
    setShowBidModal(false);
    setBidAmount("");
    setCurrentAuction(null);
  };

  const handlePlaceBid = async () => {
    const bidValue = parseFloat(bidAmount);
    const currentPrice = parseFloat(currentAuction.currently);

    if (isNaN(bidValue) || bidValue <= currentPrice) {
      setBidError(
        `Bid must be higher than the current price ($${currentPrice})`
      );
      return;
    }

    const confirmBid = window.confirm(
      `Are you sure you want to place a bid of $${bidValue} on "${currentAuction.name}"?`
    );
    if (!confirmBid) return;

    const result = await placeBid(currentAuction.id, bidValue);

    if (result.success) {
      alert(result.msg);

      // Update current price locally
      const updatedAuction = { ...currentAuction, currently: bidValue };
      setCurrentAuction(updatedAuction);

      // Update auctions list
      setAuctions((prev) =>
        prev.map((a) => (a.id === updatedAuction.id ? updatedAuction : a))
      );

      handleCloseBid();
      setBidError("");
    } else {
      setBidError(result.msg);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span
          className={styles.backArrow}
          onClick={() => navigate("/", { replace: true })}
        >
          ←
        </span>
        <h1>Browse Auctions</h1>
      </div>

      <table className={styles.auctionTable}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Categories</th>
            <th>First Bid</th>
            <th>Current Price</th>
            <th>Buy Price</th>
            <th>Start</th>
            <th>End</th>
            <th>Seller</th>
            <th>Description</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((a) => (
            <tr key={a.id}>
              <td>{a.name}</td>
              <td>{a.categories.join(", ")}</td>
              <td>{a.firstBid}</td>
              <td>{a.currently}</td>
              <td>{a.buyPrice}</td>
              <td>{formatDate(a.starts)}</td>
              <td>{formatDate(a.ends)}</td>
              <td>
                {a.seller.userID} (Rating: {a.seller.rating})
              </td>
              <td>{a.description}</td>
              <td className={styles.actions}>
                <button
                  className={styles.info}
                  onClick={() => navigate(`/my-auctions/${a.id}`)}
                >
                  Info
                </button>

                {role === "buyer" && (
                  <button
                    className={styles.bid}
                    onClick={() => handleOpenBid(a)}
                  >
                    Bid
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div
        style={{
          marginTop: "10px",
          display: "flex",
          justifyContent: "center",
          gap: "10px",
        }}
      >
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          Prev
        </button>
        <span>
          {currentPage} / {totalPages}
        </span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          Next
        </button>
      </div>

      {/* Bid Modal */}
      {showBidModal && currentAuction && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Place Your Bid for "{currentAuction.name}"</h2>
            <input
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder={`Current: $${currentAuction.currently}`}
            />
            {bidError && <p className={styles.bidError}>{bidError}</p>}
            <div className={styles.modalButtons}>
              <button onClick={handlePlaceBid}>Submit Bid</button>
              <button onClick={handleCloseBid}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BrowseAuctions;
