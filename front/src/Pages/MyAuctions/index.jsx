import React, { useState, useEffect } from "react";
import styles from "./MyAuctions.module.css";
import { useNavigate } from "react-router-dom";
import {
  createAuction,
  getAllAuctions,
  deleteAuction,
  updateAuction,
} from "../../axios/auth";
import AuctionTable from "../../Components/AuctionTable";

function MyAuctions() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(1); // 1 = Active, 0 = Pending
  const [auctions, setAuctions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });

  const [newAuction, setNewAuction] = useState({
    name: "",
    firstBid: "",
    currently: "",
    buyPrice: "",
    categories: "",
    description: "",
    location: "",
    country: "",
    starts: getLocalDateTime(),
    ends: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch all auctions once
  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const data = await getAllAuctions();

        // ✅ Correct
        const mappedAuctions = data.auctions.map((a) => ({
          id: a.id,
          name: a.name,
          categories: a.categories || [],
          firstBid: a.first_bid,
          currently: a.currently || a.first_bid,
          buyPrice: a.buy_price,
          numberOfBids: a.number_of_bids || 0,
          starts: a.started,
          ends: a.ends,
          seller: { userID: a.seller_username, rating: a.seller_rating || 0 },
          bids: a.bids || [],
          description: a.description || "",
          location: a.location,
          country: a.country,
        }));

        setAuctions(mappedAuctions);
      } catch (err) {
        console.error("Failed to fetch auctions:", err);
      }
    };
    fetchAuctions();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAuction((prev) => ({ ...prev, [name]: value }));
  };

  // Create new auction
  const handleCreateAuction = async () => {
    const {
      name,
      firstBid,
      buyPrice,
      starts,
      ends,
      description,
      location,
      country,
      categories,
    } = newAuction;

    if (
      !name ||
      !firstBid ||
      !buyPrice ||
      !starts ||
      !ends ||
      !description ||
      !location ||
      !country ||
      !categories
    ) {
      setNotification({
        message: "Please fill in all required fields.",
        type: "error",
      });
      setShowModal(false);
      setTimeout(() => setNotification({ message: "", type: "" }), 3000);
      return;
    }
    const now = new Date();

    if (new Date(starts).getTime() < now.getTime() - 60 * 1000) {
      setNotification({
        message: "Auction start time must be in the future.",
        type: "error",
      });
      setShowModal(false);
      setTimeout(() => setNotification({ message: "", type: "" }), 3000);
      return;
    }

    if (new Date(ends).getTime() <= new Date(starts).getTime()) {
      setNotification({
        message: "Auction end time must be after the start time.",
        type: "error",
      });
      setShowModal(false);
      setTimeout(() => setNotification({ message: "", type: "" }), 3000);
      return;
    }

    const payload = {
      itemName: name,
      categories: newAuction.categories.split(",").map((c) => c.trim()),
      firstBid: parseFloat(firstBid),
      buyPrice: parseFloat(buyPrice),
      location: newAuction.location,
      country: newAuction.country,
      started: starts,
      ends: ends,
      description: newAuction.description,
    };

    try {
      const res = await createAuction(payload);
      if (res.success) {
        // Refresh auctions
        const data = await getAllAuctions();
        const mappedAuctions = data.auctions.map((a) => ({
          id: a.id,
          name: a.name,
          categories: a.categories || [],
          firstBid: a.first_bid,
          currently: a.currently || a.first_bid,
          buyPrice: a.buy_price,
          numberOfBids: a.number_of_bids || 0,
          starts: a.started,
          ends: a.ends,
          seller: { userID: a.seller_username, rating: a.seller_rating || 0 },
          bids: a.bids || [],
          description: a.description || "",
          location: a.location,
          country: a.country,
        }));
        setAuctions(mappedAuctions);
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
          starts: getLocalDateTime(),
          ends: "",
        });
        setShowModal(false);
      } else {
        setNotification({
          message: res.msg || "Error creating auction.",
          type: "error",
        });
        setTimeout(() => setNotification({ message: "", type: "" }), 3000);
      }
    } catch (err) {
      console.error(err);
      setNotification({ message: "Error creating auction.", type: "error" });
      setTimeout(() => setNotification({ message: "", type: "" }), 3000);
    }
  };

  // Edit auction in frontend
  const handleEditAuction = async () => {
    const {
      name,
      firstBid,
      buyPrice,
      starts,
      ends,
      description,
      location,
      country,
      categories,
    } = newAuction;

    if (
      !name ||
      !firstBid ||
      !buyPrice ||
      !starts ||
      !ends ||
      !description ||
      !location ||
      !country ||
      !categories
    ) {
      setNotification({
        message: "Please fill in all required fields.",
        type: "error",
      });
      setShowModal(false);
      setTimeout(() => setNotification({ message: "", type: "" }), 3000);
      return;
    }

    if (new Date(starts).getTime() < now) {
      setNotification({
        message: "Auction start time must be in the future.",
        type: "error",
      });
      setShowModal(false);
      setTimeout(() => setNotification({ message: "", type: "" }), 3000);
      return;
    }

    if (new Date(ends).getTime() <= new Date(starts).getTime()) {
      setNotification({
        message: "Auction end time must be after the start time.",
        type: "error",
      });
      setShowModal(false);
      setTimeout(() => setNotification({ message: "", type: "" }), 3000);
      return;
    }

    const res = await updateAuction(newAuction.id, {
      itemName: newAuction.name,
      description: newAuction.description,
      starts: newAuction.starts,
      ends: newAuction.ends,
      buyPrice: newAuction.buyPrice,
      categories: newAuction.categories.split(",").map((c) => c.trim()),
      location: newAuction.location,
      country: newAuction.country,
      firstBid: newAuction.firstBid,
    });
    if (res.success) {
      setAuctions((prev) =>
        prev.map((a) =>
          a.id === newAuction.id
            ? {
                ...newAuction,
                categories: newAuction.categories
                  .split(",")
                  .map((c) => c.trim()),
                firstBid: parseFloat(newAuction.firstBid),
                buyPrice: parseFloat(newAuction.buyPrice),
                numberOfBids: a.numberOfBids,
                bids: a.bids,
                seller: a.seller,
              }
            : a
        )
      );
      setNotification({
        message: "Auction updated successfully!",
        type: "success",
      });
    } else {
      setNotification({
        message: "There was an error updating auction!",
        type: "error",
      });
    }
    setTimeout(() => setNotification({ message: "", type: "" }), 3000);
    setIsEditing(false);
    setShowModal(false);
  };

  const handleDeleteAuction = async (id) => {
    const result = await deleteAuction(id);
    if (result.success) {
      setAuctions((prev) => prev.filter((a) => a.id !== id));
      setNotification({
        message: "Auction deleted successfully!",
        type: "success",
      });
    } else {
      setNotification({ message: result.msg, type: "error" });
    }
    setTimeout(() => setNotification({ message: "", type: "" }), 3000);
  };

  function getLocalDateTime() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }

  const handleStartAuction = async (id) => {
    const res = await updateAuction(newAuction.id, {
      itemName: newAuction.name,
      description: newAuction.description,
      ends: newAuction.ends,
      buyPrice: newAuction.buyPrice,
      categories: newAuction.categories.split(",").map((c) => c.trim()),
      location: newAuction.location,
      country: newAuction.country,
      firstBid: newAuction.firstBid,
    });
    if (res.success) {
      setAuctions((prev) =>
        prev.map((a) =>
          a.id === newAuction.id
            ? {
                ...newAuction,
                categories: newAuction.categories
                  .split(",")
                  .map((c) => c.trim()),
                firstBid: parseFloat(newAuction.firstBid),
                buyPrice: parseFloat(newAuction.buyPrice),
                numberOfBids: a.numberOfBids,
                bids: a.bids,
                seller: a.seller,
              }
            : a
        )
      );
    }
  };

  // Filter and paginate auctions
  const now = new Date();

  const filteredAuctions = auctions.filter((a) => {
    const startDate = new Date(a.starts);
    const endDate = new Date(a.ends);

    if (activeTab === 1) {
      // Active: started <= now AND ends > now
      return (
        startDate.getTime() <= now.getTime() &&
        endDate.getTime() > now.getTime()
      );
    } else if (activeTab === 0) {
      // Pending: starts in the future
      return startDate.getTime() > now.getTime();
    } else if (activeTab === 3) {
      // Completed: already ended
      return endDate.getTime() <= now.getTime();
    }
    return false;
  });

  const totalPages = Math.ceil(filteredAuctions.length / itemsPerPage);

  const paginatedAuctions = filteredAuctions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>{isEditing ? "Edit Auction" : "Create New Auction"}</h2>

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
              value={newAuction.starts}
              onChange={handleInputChange}
            />
            <label>End Date and Time</label>
            <input
              type="datetime-local"
              name="ends"
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
              {isEditing ? (
                <button
                  className={styles.createBtn}
                  onClick={handleEditAuction}
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
                }}
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
          className={`${styles.tab} ${activeTab === 1 ? styles.activeTab : ""}`}
          onClick={() => {
            setActiveTab(1);
            setCurrentPage(1); // reset
          }}
        >
          Active
        </button>
        <button
          className={`${styles.tab} ${activeTab === 0 ? styles.activeTab : ""}`}
          onClick={() => {
            setActiveTab(0);
            setCurrentPage(1); // reset
          }}
        >
          Pending
        </button>
        <button
          className={`${styles.tab} ${activeTab === 3 ? styles.activeTab : ""}`}
          onClick={() => {
            setActiveTab(3);
            setCurrentPage(1); // reset
          }}
        >
          Completed
        </button>
      </div>

      {/* Notifications */}
      {notification.message && (
        <div
          className={`${styles.notification} ${
            notification.type === "error" ? styles.error : styles.success
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Auctions Table */}
      <AuctionTable
        auctions={paginatedAuctions}
        onEdit={(auction) => {
          setIsEditing(true);
          setShowModal(true);

          setNewAuction({
            id: auction.id,
            name: auction.name,
            firstBid: auction.firstBid,
            buyPrice: auction.buyPrice,
            categories: auction.categories.join(", "),
            description: auction.description,
            location: auction.location,
            country: auction.country,
            starts: new Date(auction.starts).toISOString().slice(0, 16),
            ends: new Date(auction.ends).toISOString().slice(0, 16),
          });
        }}
        onDelete={handleDeleteAuction}
        onStart={handleStartAuction}
        onBids={() => navigate("/bids")}
        onInfo={(id) => navigate(`/my-auctions/${id}`)}
      />

      {/* Pagination */}
      <div style={{ marginTop: "10px" }}>
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          Prev
        </button>
        <span style={{ margin: "0 10px" }}>
          {currentPage} / {totalPages}
        </span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
export default MyAuctions;
