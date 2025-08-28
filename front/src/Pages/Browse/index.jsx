import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllAuctions,
  getUserRole,
  getOwnInfo,
  placeBid,
} from "../../axios/auth";
import styles from "./Browse.module.css";
import formatDate from "../../Utils/formatDate";
import axios from "axios";

function BrowseAuctions() {
  const navigate = useNavigate();
  const [allAuctions, setAllAuctions] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [role, setRole] = useState("");
  const [userId, setUserId] = useState(null);
  const [tab, setTab] = useState("active"); // "active" or "completed"

  // Modal state
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [currentAuction, setCurrentAuction] = useState(null);
  const [bidError, setBidError] = useState("");

  const [loading, setLoading] = useState(true);

  // Filters
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [locationSearch, setLocationSearch] = useState("");

  // Fetch user info
  useEffect(() => {
    const fetchUser = async () => {
      const roleRes = await getUserRole();
      if (roleRes.success) setRole(roleRes.role);
      const infoRes = await getOwnInfo();
      if (infoRes.user) setUserId(infoRes.user.id);
    };
    fetchUser();
  }, []);

  // Fetch auctions
  useEffect(() => {
    const fetchAuctions = async () => {
      setLoading(true);
      try {
        const data = await getAllAuctions();
        const user = await getOwnInfo();

        const mapped = data.auctions
          .map((a) => ({
            id: a.id,
            name: a.name,
            categories: a.categories || [],
            firstBid: a.first_bid,
            currently: a.currently || a.first_bid,
            buyPrice: a.buy_price,
            numberOfBids: a.bid_count || 0,
            starts: a.started,
            ends: a.ends,
            seller: {
              id: a.seller_id,
              username: a.seller_username || "Unknown",
            },
            description: a.description || "",
            country: a.country,
            location: a.location,
          }))
          .filter(
            (a) =>
              a.seller?.userID !== user.user.username &&
              a.seller.id !== user.user.id
          );

        setAllAuctions(mapped);
      } catch (err) {
        console.error("Failed to load auctions:", err);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchAuctions();
  }, [userId]);

  // Calculate counts for tabs
  const now = new Date();
  const activeCount = allAuctions.filter(
    (a) => now >= new Date(a.starts) && now <= new Date(a.ends)
  ).length;
  const completedCount = allAuctions.filter(
    (a) => now > new Date(a.ends)
  ).length;

  // Apply filters and tab
  useEffect(() => {
    let filtered = [...allAuctions];

    // Tab filter
    filtered = filtered.filter((a) =>
      tab === "active"
        ? now >= new Date(a.starts) && now <= new Date(a.ends)
        : now > new Date(a.ends)
    );

    // Category filter
    if (selectedCategory.trim() !== "") {
      const catTerm = selectedCategory.toLowerCase();
      filtered = filtered.filter((a) =>
        a.categories.some((c) => c.toLowerCase().includes(catTerm))
      );
    }

    // Search term filter
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(term) ||
          a.description.toLowerCase().includes(term)
      );
    }
    // Price filters
    if (minPrice !== "")
      filtered = filtered.filter(
        (a) => parseFloat(a.currently) >= parseFloat(minPrice)
      );
    if (maxPrice !== "")
      filtered = filtered.filter(
        (a) => parseFloat(a.currently) <= parseFloat(maxPrice)
      );
    // Location filter
    if (locationSearch.trim() !== "") {
      const loc = locationSearch.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          (a.country && a.country.toLowerCase().includes(loc)) ||
          (a.location && a.location.toLowerCase().includes(loc))
      );
    }

    setAuctions(filtered);
    setCurrentPage(1);
  }, [
    allAuctions,
    tab,
    selectedCategory,
    searchTerm,
    minPrice,
    maxPrice,
    locationSearch,
  ]);

  // Pagination
  const totalPages = Math.ceil(auctions.length / itemsPerPage);
  const paginated = auctions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Bid modal handlers
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
    const buyPrice = parseFloat(currentAuction.buyPrice);

    if (isNaN(bidValue) || bidValue <= currentPrice) {
      setBidError(
        `Bid must be higher than the current price ($${currentPrice})`
      );
      return;
    }
    if (buyPrice && bidValue >= buyPrice) {
      handleBuy(currentAuction);
      handleCloseBid();
      return;
    }

    const confirmBid = window.confirm(
      `Are you sure you want to place a bid of $${bidValue} on "${currentAuction.name}"?`
    );
    if (!confirmBid) return;

    const result = await placeBid(currentAuction.id, bidValue);
    if (result.success) {
      alert(result.msg);
      const updatedAuction = {
        ...currentAuction,
        currently: bidValue,
        numberOfBids: (currentAuction.numberOfBids || 0) + 1,
      };
      setCurrentAuction(updatedAuction);
      setAuctions((prev) =>
        prev.map((a) => (a.id === updatedAuction.id ? updatedAuction : a))
      );
      setAllAuctions((prev) =>
        prev.map((a) => (a.id === updatedAuction.id ? updatedAuction : a))
      );
      handleCloseBid();
      setBidError("");
    } else {
      setBidError(result.msg);
    }
  };

  const handleBuy = (auction) => {
    const confirmBuy = window.confirm(
      `Buy "${auction.name}" for $${auction.buyPrice}?`
    );
    if (!confirmBuy) return;

    const token = localStorage.getItem("token");
    axios
      .post(
        `http://localhost:5000/api/auctions/buy/${auction.id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => {
        alert(res.data.msg);
        setAuctions((prev) => prev.filter((a) => a.id !== auction.id));
        setAllAuctions((prev) => prev.filter((a) => a.id !== auction.id));
      })
      .catch((err) => {
        console.error(err);
        alert(err.response?.data?.msg || "Error processing Buy Now");
      });
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
        <div className={styles.headerContent}>
          <h1>Browse Auctions</h1>
          {role !== "visitor" && (
            <button
              className={styles.myAuctionsBtn}
              onClick={() => navigate("/auctions-bought")}
            >
              My Auctions
            </button>
          )}
        </div>
      </div>

      {/* Tabs with counts */}
      <div className={styles.tabContainer}>
        <button
          className={`${styles.tabButton} ${
            tab === "active" ? styles.activeTab : ""
          }`}
          onClick={() => setTab("active")}
        >
          Active ({activeCount})
        </button>
        <button
          className={`${styles.tabButton} ${
            tab === "completed" ? styles.activeTab : ""
          }`}
          onClick={() => setTab("completed")}
        >
          Completed ({completedCount})
        </button>
      </div>

      {loading ? (
        <p>Loading auctions...</p>
      ) : (
        <>
          {/* Filters */}
          <div className={styles.filterContainer}>
            <label>Category:</label>
            <input
              type="text"
              placeholder="Search category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            />

            <label>Search:</label>
            <input
              type="text"
              placeholder="Search by name/description"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <label>Price:</label>
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />

            <label>Location:</label>
            <input
              type="text"
              placeholder="Location/Country"
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
            />
          </div>

          {/* Auction Table */}
          <table className={styles.auctionTable}>
            <thead>
              <tr>
                <th>Name</th>
                <th>First Bid</th>
                <th>Current Price</th>
                <th>Buy Price</th>
                <th>Categories</th>
                <th>Bids</th>
                <th>Start</th>
                <th>End</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td>{a.firstBid}</td>
                  <td>{a.currently || a.firstBid}</td>
                  <td>{a.buyPrice || "-"}</td>
                  <td>{a.categories.join(", ")}</td>
                  <td>{a.numberOfBids}</td>
                  <td>{formatDate(a.starts)}</td>
                  <td>{formatDate(a.ends)}</td>
                  <td className={styles.actions}>
                    <button
                      className={styles.info}
                      onClick={() => navigate(`/my-auctions/${a.id}`)}
                    >
                      Info
                    </button>
                    {role === "buyer" && tab === "active" && (
                      <>
                        <button
                          className={styles.bid}
                          onClick={() => handleOpenBid(a)}
                        >
                          Bid
                        </button>
                        <button
                          className={styles.buy}
                          onClick={() => handleBuy(a)}
                        >
                          Buy
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className={styles.pagination}>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Prev
            </button>
            <span>
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}

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
