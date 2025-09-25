import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getUserRole,
  placeBid,
  getActiveAuctions,
  getCompletedAuctions,
  getAuctionCounts,
} from "../../axios/auth";
import styles from "./Browse.module.css";
import formatDate from "../../Utils/formatDate";
import axios from "axios";

function BrowseAuctions() {
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);
  // State for pagination per tab
  const [currentPage, setCurrentPage] = useState({ active: 1, completed: 1 });
  const [totalPages, setTotalPages] = useState({ active: 0, completed: 0 });
  const [totalAuctions, setTotalAuctions] = useState({
    active: 0,
    completed: 0,
  });
  const [orderBy, setOrderBy] = useState("id"); // Default order by id
  const [orderDir, setOrderDir] = useState("DESC"); // Default descending

  const [role, setRole] = useState("");
  const [tab, setTab] = useState("active");

  // Modal state
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [currentAuction, setCurrentAuction] = useState(null);
  const [bidError, setBidError] = useState("");

  const [loading, setLoading] = useState(true);

  // Filters (optional – right now applied client-side)
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
    };
    fetchUser();
  }, []);

  const fetchAuctions = async (tabName, pageNum) => {
    try {
      setLoading(true);

      const params = {
        page: pageNum,
        limit: PAGE_LIMIT,
        category: selectedCategory || undefined,
        search: searchTerm || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        location: locationSearch || undefined,
        orderBy,
        orderDir,
      };

      let res;
      if (tabName === "active") res = await getActiveAuctions(params);
      else res = await getCompletedAuctions(params);

      setAuctions(res.auctions);

      setCurrentPage((prev) => ({
        ...prev,
        [tabName]: pageNum,
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderPagination = () => {
    const pages = getPageNumbers(currentPage[tab], totalPages[tab], 5);
    const buttons = [];

    // Prev button
    buttons.push(
      <button
        key="prev"
        disabled={currentPage[tab] === 1}
        onClick={() => fetchAuctions(tab, currentPage[tab] - 1)}
      >
        Prev
      </button>
    );

    // Leading ellipsis if needed
    if (pages[0] > 1) {
      buttons.push(
        <button key={1} onClick={() => fetchAuctions(tab, 1)}>
          1
        </button>
      );
      if (pages[0] > 2) buttons.push(<span key="start-ellipsis">...</span>);
    }

    // Numbered page buttons
    pages.forEach((num) => {
      buttons.push(
        <button
          key={num}
          className={num === currentPage[tab] ? styles.activePage : ""}
          onClick={() => fetchAuctions(tab, num)}
        >
          {num}
        </button>
      );
    });

    // Trailing ellipsis if needed
    if (pages[pages.length - 1] < totalPages[tab]) {
      if (pages[pages.length - 1] < totalPages[tab] - 1)
        buttons.push(<span key="end-ellipsis">...</span>);
      buttons.push(
        <button
          key={totalPages[tab]}
          onClick={() => fetchAuctions(tab, totalPages[tab])}
        >
          {totalPages[tab]}
        </button>
      );
    }

    // Next button
    buttons.push(
      <button
        key="next"
        disabled={currentPage[tab] === totalPages[tab]}
        onClick={() => fetchAuctions(tab, currentPage[tab] + 1)}
      >
        Next
      </button>
    );

    return buttons;
  };

  const PAGE_LIMIT = 10;

  const getTotalPages = async (tabName) => {
    try {
      const counts = await getAuctionCounts();
      setTotalPages((prev) => ({
        ...prev,
        active: Math.ceil(counts.active / PAGE_LIMIT),
        completed: Math.ceil(counts.completed / PAGE_LIMIT),
      }));

      setTotalAuctions((prev) => ({
        ...prev,
        active: counts.active,
        completed: counts.completed,
      }));

      setCurrentPage((prev) => ({
        ...prev,
        [tabName]: 0,
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const getPageNumbers = (current, total, maxButtons = 5) => {
    let start = Math.max(1, current - Math.floor(maxButtons / 2));
    let end = start + maxButtons - 1;

    if (end > total) {
      end = total;
      start = Math.max(1, end - maxButtons + 1);
    }

    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const handleSort = (column) => {
    if (orderBy === column) {
      // Toggle direction
      setOrderDir((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setOrderBy(column);
      setOrderDir("ASC"); // Default new column to ascending
    }
    // Refetch with new sorting
    fetchAuctions(tab, currentPage[tab]);
  };

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
      handleCloseBid();
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
      })
      .catch((err) => {
        console.error(err);
        alert(err.response?.data?.msg || "Error processing Buy Now");
      });
  };

  useEffect(() => {
    fetchAuctions(tab, currentPage[tab]);
  }, [tab]);

  useEffect(() => {
    getTotalPages("active");
    getTotalPages("completed");
  }, []);

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
          Active ({totalAuctions.active})
        </button>
        <button
          className={`${styles.tabButton} ${
            tab === "completed" ? styles.activeTab : ""
          }`}
          onClick={() => setTab("completed")}
        >
          Completed ({totalAuctions.completed})
        </button>
      </div>

      {loading ? (
        <p>Loading auctions...</p>
      ) : auctions.length === 0 ? (
        <p>No auctions</p>
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

            {/* Apply Filters Button */}
            <button
              onClick={() => {
                // Always start from page 1 when applying new filters
                fetchAuctions(tab, 1);
              }}
            >
              Apply Filters
            </button>
          </div>

          {/* Auction Table */}
          <table className={styles.auctionTable}>
            <thead>
              <tr>
                <th onClick={() => handleSort("name")}>Name</th>
                <th onClick={() => handleSort("first_bid")}>First Bid</th>
                <th onClick={() => handleSort("currently")}>Current Price</th>
                <th onClick={() => handleSort("buy_price")}>Buy Price</th>
                <th>Categories</th>
                <th onClick={() => handleSort("numberOfBids")}>Bids</th>
                <th onClick={() => handleSort("started")}>Start</th>
                <th onClick={() => handleSort("ends")}>End</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {auctions.map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td>{a.first_bid}</td>
                  <td>{a.currently || a.first_bid}</td>
                  <td>{a.buy_price || "-"}</td>
                  <td>
                    {a.categories && a.categories.length > 0
                      ? (() => {
                          const text = Array.isArray(a.categories)
                            ? a.categories.join(", ")
                            : a.categories;
                          return text.length > 40
                            ? text.slice(0, 40) + "..."
                            : text;
                        })()
                      : "-"}
                  </td>
                  <td>{a.numberOfBids}</td>
                  <td>{formatDate(a.started)}</td>
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

              {/* Add empty rows to fill table */}
              {Array.from({ length: PAGE_LIMIT - auctions.length }).map(
                (_, idx) => (
                  <tr key={`empty-${idx}`} className={styles.emptyRow}>
                    <td colSpan="9">&nbsp;</td>
                  </tr>
                )
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className={styles.pagination}>{renderPagination()}</div>
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
