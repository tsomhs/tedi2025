import React, { useState, useEffect } from "react";
import styles from "./MyAuctions.module.css";
import { useNavigate } from "react-router-dom";
import {
  createAuction,
  getMyAuctions,
  deleteAuction,
  updateAuction,
  getOwnInfo,
} from "../../axios/auth";
import AuctionTable from "../../Components/AuctionTable";

function MyAuctions() {
  const itemsPerPage = 10;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(1);
  const [auctions, setAuctions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [lastFailedAuction, setLastFailedAuction] = useState(null);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [newAuction, setNewAuction] = useState(getEmptyAuction());

  //Helpers

  function getLocalDateTime(date = new Date()) {
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }

  function getEmptyAuction() {
    return {
      id: null,
      name: "",
      firstBid: "",
      buyPrice: "",
      categories: "",
      description: "",
      latitude: "",
      longitude: "",
      country: "",
      location: "",
      starts: getLocalDateTime(),
      ends: getLocalDateTime(new Date(Date.now() + 3600 * 1000)), // default 1h later
    };
  }

  const normalizeDate = (dateStr) => {
    if (!dateStr) return null;
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateStr)) return dateStr;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateStr))
      return dateStr.replace("T", " ") + ":00";
    return new Date(dateStr).toISOString().slice(0, 19).replace("T", " ");
  };

  const notify = (message, type = "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: "", type: "" }), 3000);
  };

  // Fetch Auctions
  const fetchAuctions = async () => {
    try {
      const data = await getMyAuctions();
      const user = await getOwnInfo();
      const mappedAuctions = data.auctions
        .map((a) => ({
          id: a.id,
          name: a.name,
          categories: a.categories || [],
          firstBid: a.first_bid ?? "",
          currently: a.currently ?? a.first_bid,
          buyPrice: a.buy_price ?? "",
          numberOfBids: a.bid_count ?? 0,
          starts: a.started,
          ends: a.ends,
          seller: { userID: a.seller_username, rating: a.seller_rating ?? 0 },
          bids: a.bids || [],
          description: a.description || "",
          latitude: a.latitude ?? "",
          longitude: a.longitude ?? "",
          country: a.country ?? "",
          location: a.location ?? "",
        }))
        .filter((a) => a.seller?.userID === user.user.username);

      setAuctions(mappedAuctions);
    } catch (err) {
      console.error("Failed to fetch auctions:", err);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAuction((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateAuction = async () => {
    const {
      name,
      firstBid,
      buyPrice,
      starts,
      ends,
      description,
      latitude,
      longitude,
      country,
      location,
      categories,
    } = newAuction;

    if (
      !name ||
      !firstBid ||
      !buyPrice ||
      !starts ||
      !ends ||
      !description ||
      !categories
    ) {
      setLastFailedAuction({ ...newAuction });
      setShowModal(false);
      return notify("Please fill in all required fields.");
    }

    if (new Date(ends) <= new Date(starts)) {
      setLastFailedAuction({ ...newAuction });
      setShowModal(false);
      return notify("Auction end time must be after the start time.");
    }

    const payload = {
      itemName: name,
      categories: categories.split(",").map((c) => c.trim()),
      firstBid: parseFloat(firstBid),
      buyPrice: parseFloat(buyPrice),
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      country: country || "",
      location: location || "",
      started: normalizeDate(starts),
      ends: normalizeDate(ends),
      description,
    };

    try {
      const res = await createAuction(payload);
      if (!res.success) {
        setLastFailedAuction({ ...newAuction });
        setShowModal(false);
        return notify(res.msg || "Error creating auction.");
      }
      setNewAuction(getEmptyAuction());

      await fetchAuctions();
      setShowModal(false);
      setActiveTab(1);
      notify("Auction created successfully!", "success");
    } catch (err) {
      console.error(err);
      setLastFailedAuction({ ...newAuction });
      setShowModal(false);
      notify("Error creating auction.");
    }
  };

  const submitEditAuction = async () => {
    const {
      id,
      name,
      firstBid,
      buyPrice,
      categories,
      description,
      latitude,
      longitude,
      country,
      location,
      starts,
      ends,
    } = newAuction;

    if (!id) return notify("Invalid auction ID.");
    if (new Date(ends) <= new Date(starts)) {
      setLastFailedAuction({ ...newAuction });
      setShowModal(false);
      return notify("Auction end time must be after the start time.");
    }

    const payload = {
      auctionId: id,
      itemName: name || "",
      categories: categories?.split(",").map((c) => c.trim()) || [],
      firstBid: firstBid !== "" ? parseFloat(firstBid) : 0,
      buyPrice: buyPrice !== "" ? parseFloat(buyPrice) : 0,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      country: country || "",
      location: location || "",
      started: normalizeDate(starts),
      ends: normalizeDate(ends),
      description: description || "",
    };

    console.log("Updating auction with payload:", payload);

    try {
      const res = await updateAuction(id, payload);
      console.log("Auction updated:", res.data);
      await fetchAuctions();
      setShowModal(false);
      setIsEditing(false);
      notify("Auction updated successfully!", "success");
    } catch (error) {
      console.error("Error updating auction:", error);
      notify("Error updating auction.");
    }
  };

  const handleDeleteAuction = async (id) => {
    const result = await deleteAuction(id);
    if (result.success) {
      setAuctions((prev) => prev.filter((a) => a.id !== id));
      notify("Auction deleted successfully!", "success");
    } else {
      notify(result.msg, "error");
    }
  };

  const handleStartAuction = async (auction) => {
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    const payload = {
      auctionId: auction.id,
      itemName: auction.name || "",
      firstBid: auction.firstBid !== "" ? parseFloat(auction.firstBid) : 0,
      buyPrice: auction.buyPrice !== "" ? parseFloat(auction.buyPrice) : 0,
      latitude: auction.latitude ? parseFloat(auction.latitude) : null,
      longitude: auction.longitude ? parseFloat(auction.longitude) : null,
      country: auction.country || "",
      location: auction.location || "",
      started: now,
      ends: auction.ends ? normalizeDate(auction.ends) : now,
      description: auction.description || "",
      categories: auction.categories || [],
    };

    try {
      await updateAuction(auction.id, payload);
      await fetchAuctions();
      setActiveTab(1);
      notify("Auction started successfully!", "success");
    } catch (err) {
      console.error("Error starting auction:", err);
      notify("Error starting auction.", "error");
    }
  };

  // UI
  const filteredAuctions = auctions.filter((a) => {
    const startDate = new Date(a.starts);
    const endDate = new Date(a.ends);
    const now = new Date();

    if (activeTab === 1) return startDate <= now && endDate > now; // Active
    if (activeTab === 0) return startDate > now; // Pending
    if (activeTab === 3) return endDate <= now; // Completed
    if (activeTab === 4) return endDate <= now && a.numberOfBids > 0; // Sold
    return false;
  });

  const totalPages = Math.ceil(filteredAuctions.length / itemsPerPage);
  const paginatedAuctions = filteredAuctions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className={styles.container}>
      <span
        className={styles.backArrow}
        onClick={() => navigate("/", { replace: true })}
      >
        ←
      </span>

      <button
        className={styles.newAuctionBtn}
        onClick={() => {
          setShowModal(true);
          setIsEditing(false);
          setNewAuction(lastFailedAuction || getEmptyAuction());
        }}
      >
        + New Auction
      </button>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>{isEditing ? "Edit Auction" : "Create New Auction"}</h2>

            <input
              type="text"
              name="name"
              placeholder="Auction Name"
              value={newAuction.name ?? ""}
              onChange={handleInputChange}
            />
            <input
              type="number"
              name="firstBid"
              placeholder="First Bid"
              value={newAuction.firstBid ?? ""}
              onChange={handleInputChange}
            />
            <input
              type="number"
              name="buyPrice"
              placeholder="Buy Price"
              value={newAuction.buyPrice ?? ""}
              onChange={handleInputChange}
            />
            <label>Start Date and Time</label>
            <input
              type="datetime-local"
              name="starts"
              value={newAuction.starts ?? ""}
              onChange={handleInputChange}
            />
            <label>End Date and Time</label>
            <input
              type="datetime-local"
              name="ends"
              value={newAuction.ends ?? ""}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="categories"
              placeholder="Categories (comma separated)"
              value={newAuction.categories ?? ""}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="country"
              placeholder="Country"
              value={newAuction.country ?? ""}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="location"
              placeholder="City / Location"
              value={newAuction.location ?? ""}
              onChange={handleInputChange}
            />
            <input
              type="number"
              step="any"
              name="latitude"
              placeholder="Latitude"
              value={newAuction.latitude ?? ""}
              onChange={handleInputChange}
            />
            <input
              type="number"
              step="any"
              name="longitude"
              placeholder="Longitude"
              value={newAuction.longitude ?? ""}
              onChange={handleInputChange}
            />
            <textarea
              name="description"
              placeholder="Description"
              value={newAuction.description ?? ""}
              onChange={handleInputChange}
            />

            <div className={styles.modalButtons}>
              {isEditing ? (
                <button
                  className={styles.createBtn}
                  onClick={submitEditAuction}
                >
                  Save Changes
                </button>
              ) : (
                <button
                  className={styles.createBtn}
                  onClick={handleCreateAuction}
                >
                  Create
                </button>
              )}
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setShowModal(false);
                  setIsEditing(false);
                  setNewAuction(getEmptyAuction());
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs & Table */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 1 ? styles.activeTab : ""}`}
          onClick={() => {
            setActiveTab(1);
            setCurrentPage(1);
          }}
        >
          Active
        </button>
        <button
          className={`${styles.tab} ${activeTab === 0 ? styles.activeTab : ""}`}
          onClick={() => {
            setActiveTab(0);
            setCurrentPage(1);
          }}
        >
          Pending
        </button>
        <button
          className={`${styles.tab} ${activeTab === 3 ? styles.activeTab : ""}`}
          onClick={() => {
            setActiveTab(3);
            setCurrentPage(1);
          }}
        >
          Completed
        </button>
        <button
          className={`${styles.tab} ${activeTab === 4 ? styles.activeTab : ""}`}
          onClick={() => {
            setActiveTab(4);
            setCurrentPage(1);
          }}
        >
          Sold
        </button>
      </div>

      {notification.message && (
        <div
          className={`${styles.notification} ${
            notification.type === "error" ? styles.error : styles.success
          }`}
        >
          {notification.message}
        </div>
      )}

      <AuctionTable
        auctions={paginatedAuctions}
        onEdit={(auction) => {
          setIsEditing(true);
          setShowModal(true);
          setNewAuction({
            id: auction.id,
            name: auction.name ?? "",
            firstBid: auction.firstBid ?? "",
            buyPrice: auction.buyPrice ?? "",
            categories: auction.categories?.join(", ") ?? "",
            description: auction.description ?? "",
            latitude: auction.latitude ?? "",
            longitude: auction.longitude ?? "",
            country: auction.country ?? "",
            location: auction.location ?? "",
            starts: getLocalDateTime(new Date(auction.starts)),
            ends: getLocalDateTime(new Date(auction.ends)),
          });
        }}
        onDelete={handleDeleteAuction}
        onStart={(id) => handleStartAuction(id)}
        onInfo={(id) => navigate(`/my-auctions/${id}`)}
      />

      <div className={styles.pagination}>
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
        >
          Prev
        </button>
        <span>
          {totalPages > 0 ? `${currentPage} / ${totalPages}` : "0 / 0"}
        </span>
        <button
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => setCurrentPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default MyAuctions;
