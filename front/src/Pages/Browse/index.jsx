import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllAuctions,
  getUserRole,
  getOwnInfo,
  getUserById,
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

  // modal
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [currentAuction, setCurrentAuction] = useState(null);
  const [bidError, setBidError] = useState("");

  const [loading, setLoading] = useState(true);

  // φίλτρα
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [location, setLocation] = useState("");

  const [filteredAuctions, setFilteredAuctions] = useState([]);

  // user info
  useEffect(() => {
    const fetchUser = async () => {
      const roleRes = await getUserRole();
      if (roleRes.success) setRole(roleRes.role);
      const infoRes = await getOwnInfo();
      if (infoRes.user) setUserId(infoRes.user.id);
    };
    fetchUser();
  }, []);

  // Apply filters whenever something changes
  useEffect(() => {
    let filtered = allAuctions.filter((a) => {
      // Determine price to use (current bid if exists, otherwise first bid)
      const price = parseFloat(a.current_price ?? a.first_bid);
      if (isNaN(price)) return false;

      // Category filter
      const matchesCategory =
        selectedCategory === "All" ||
        (a.categories && a.categories.includes(selectedCategory));

      // Price filter
      const matchesMin = minPrice === "" || price >= parseFloat(minPrice);
      const matchesMax = maxPrice === "" || price <= parseFloat(maxPrice);

      return matchesCategory && matchesMin && matchesMax;
    });

    setFilteredAuctions(filtered);
    setCurrentPage(1); // reset to first page whenever filter changes
  }, [allAuctions, selectedCategory, minPrice, maxPrice]);

  // fetch auctions
  useEffect(() => {
    const fetchAuctions = async () => {
      setLoading(true);
      try {
        const data = await getAllAuctions();
        const now = new Date();

        const mappedPromises = data.auctions.map(async (a) => {
          const sellerRes = await getUserById(a.seller_id);
          const sellerName = sellerRes.success
            ? sellerRes.user.username
            : "Unknown";

          return {
            id: a.id,
            name: a.name,
            categories: a.categories || [],
            firstBid: a.first_bid,
            currently: a.currently,
            buyPrice: a.buy_price,
            starts: a.started,
            ends: a.ends,
            seller: {
              id: a.seller_id,
              username: sellerName,
              rating: a.seller_rating || 0,
            },
            bids: a.bids || [],
            description: a.description || "",
            location: a.location,
            country: a.country,
          };
        });

        const mapped = await Promise.all(mappedPromises);

        const filtered = mapped.filter(
          (a) =>
            now >= new Date(a.starts) &&
            now <= new Date(a.ends) &&
            a.seller.id !== userId
        );

        setAllAuctions(filtered);
        setAuctions(filtered);

        const allCategories = new Set();
        filtered.forEach((a) =>
          a.categories.forEach((c) => allCategories.add(c))
        );
        setCategories(["All", ...Array.from(allCategories)]);
      } catch (err) {
        console.error("Failed to load auctions:", err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchAuctions();
  }, [userId]);

  // ---- apply filters ----
  useEffect(() => {
    let filtered = [...allAuctions];

    // category
    if (selectedCategory !== "All") {
      filtered = filtered.filter((a) =>
        a.categories.includes(selectedCategory)
      );
    }

    // search term
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(term) ||
          a.description.toLowerCase().includes(term)
      );
    }

    // price range
    if (minPrice !== "") {
      filtered = filtered.filter(
        (a) => parseFloat(a.currently) >= parseFloat(minPrice)
      );
    }
    if (maxPrice !== "") {
      filtered = filtered.filter(
        (a) => parseFloat(a.currently) <= parseFloat(maxPrice)
      );
    }

    // location
    if (location.trim() !== "") {
      const loc = location.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.location.toLowerCase().includes(loc) ||
          a.country.toLowerCase().includes(loc)
      );
    }

    setAuctions(filtered);
    setCurrentPage(1); // reset pagination on filter change
  }, [selectedCategory, searchTerm, minPrice, maxPrice, location, allAuctions]);

  // pagination
  const totalPages = Math.ceil(auctions.length / itemsPerPage);
  const paginated = auctions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // bid modal
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
      const updatedAuction = { ...currentAuction, currently: bidValue };
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

  // buy now
  const handleBuy = (auction) => {
    const confirmBuy = window.confirm(
      `Are you sure you want to Buy Now "${auction.name}" for $${auction.buyPrice}?`
    );
    if (!confirmBuy) return;

    const token = localStorage.getItem("token");

    axios
      .post(
        `http://localhost:5000/api/auctions/buy/${auction.id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
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
          <button
            className={styles.myAuctionsBtn}
            onClick={() => navigate("/auctions-bought")}
          >
            My Auctions
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading auctions...</p>
      ) : (
        <>
          {/* filters */}
          <div className={styles.filterContainer}>
            <label>Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

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
              placeholder="City or Country"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* table */}
          <table className={styles.auctionTable}>
            <thead>
              <tr>
                <th>Name</th>
                <th>First Bid</th>
                <th>Current Price</th>
                <th>Buy Price</th>
                <th>Categories</th>
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
                  <td>{a.buyPrice}</td>
                  <td>{a.categories.join(", ")}</td>
                  <td>{formatDate(a.starts)}</td>
                  <td>{formatDate(a.ends)}</td>
                  <td className={styles.actions}>
                    <button
                      className={styles.info}
                      onClick={() => navigate(`/my-auctions/${a.id}`)}
                    >
                      Info
                    </button>
                    {role === "buyer" && (
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
        </>
      )}

      {/* pagination */}
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

      {/* modal */}
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
