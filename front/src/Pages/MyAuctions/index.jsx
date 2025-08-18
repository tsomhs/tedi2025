import React, { useState, useEffect } from "react";
import styles from "./MyAuctions.module.css";
import { useNavigate } from "react-router-dom";
import formatDate from "../../Utils/formatDate";
import { CreateAuctionApi, getAllAuctions } from "../../axios/auth";

// TODO To active kai to pending tha eprepe na ta ipologizoume analogws an to Date.now() einai anamesa sto auction starts kai ends

function MyAuctions() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(1); // "Active" or "Pending"
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
    starts: new Date().toISOString().slice(0, 16), // default to now
    ends: "",
  });

  const [notification, setNotification] = useState({ message: "", type: "" });

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const data = await getAllAuctions(1, 10);
        const mappedAuctions = data.auctions.map((a) => ({
          id: a.id,
          name: a.name,
          categories: a.categories || [],
          firstBid: a.first_bid,
          currently: a.currently || a.first_bid, // if backend doesn't provide
          buyPrice: a.buy_price,
          numberOfBids: a.number_of_bids || 0, // optional
          starts: a.started,
          ends: a.ends,
          status: Number(a.status), // preserves 0 or 1 exactly as backend sends
          seller: { userID: a.seller_username, rating: a.seller_rating || 0 },
          bids: a.bids || [],
          description: a.description || "",
          location: a.location,
          country: a.country,
        }));
        setAuctions(mappedAuctions);
        console.log("All auctions:", mappedAuctions);
        console.log(
          "Filtered auctions:",
          mappedAuctions.filter((a) => a.status === activeTab)
        );
      } catch (err) {
        setError("Failed to fetch auctions.");
      }
    };

    fetchAuctions();
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
              status: auction.status || 0,
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
        auction.id === id ? { ...auction, status: 1 } : auction
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
      status: 0,
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

    await CreateAuctionApi(auction);
  };

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
          className={`${styles.tab} ${activeTab === 1 ? styles.activeTab : ""}`}
          onClick={() => setActiveTab(1)}
        >
          Active
        </button>
        <button
          className={`${styles.tab} ${activeTab === 0 ? styles.activeTab : ""}`}
          onClick={() => setActiveTab(0)}
        >
          Pending
        </button>
      </div>

      {/* Auctions Table */}
      <div className={styles.auctionList}>
        <div
          className={`${styles.notification} ${
            notification.type === "error" ? styles.error : styles.success
          }`}
          style={{
            visibility: notification.message ? "visible" : "hidden",
          }}
        >
          {
            notification.message ||
              "Auction updated successfully! " /* non-breaking space keeps height */
          }
        </div>

        <AuctionTable
          auctions={filteredAuctions || []} // ✅ now uses the filtered list
          onEdit={(auction) => {
            setIsEditing(true);
            setNewAuction({
              ...auction,
              categories: auction.categories.join(", "),
            });
          }}
          onDelete={(id) => handleDeleteAuction(id)}
          onStart={(id) => handleStartAuction(id)}
          onBids={() => navigate("/bids")}
          onInfo={(id) => navigate(`/my-auctions/${id}`)}
        />
      </div>
    </div>
  );
}

function AuctionTable({ auctions, onEdit, onDelete, onStart, onBids, onInfo }) {
  return (
    <table className={styles.auctionTable}>
      <thead>
        <tr>
          <th>Name</th>
          <th>Categories</th>
          <th>First Bid</th>
          <th>Current Price</th>
          <th>Buy Price</th>
          <th>Bids</th>
          <th>Start</th>
          <th>End</th>
          <th>Location</th>
          <th>Country</th>
          <th>Seller</th>
          <th>Description</th>
          <th className={styles.actionsHeader}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {auctions.map((item) => (
          <tr key={item.id}>
            <td>{item.name}</td>
            <td>{item.categories.join(", ")}</td>
            <td>{item.firstBid}</td>
            <td>{item.currently}</td>
            <td>{item.buyPrice}</td>
            <td>{item.numberOfBids}</td>
            <td>{formatDate(item.starts)}</td>
            <td>{formatDate(item.ends)}</td>
            <td>{item.location}</td>
            <td>{item.country}</td>
            <td>
              {item.seller.userID} (Rating: {item.seller.rating})
            </td>
            <td>{item.description}</td>
            <td className={styles.actions}>
              <button className={styles.info} onClick={() => onInfo(item.id)}>
                Info
              </button>
              {item.status === 0 && (
                <>
                  <button
                    className={styles.start}
                    onClick={() => onStart(item.id)}
                  >
                    Start
                  </button>
                  {item.bids.length === 0 && (
                    <>
                      <button
                        className={styles.edit}
                        onClick={() => onEdit(item)}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.delete}
                        onClick={() => onDelete(item.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                  {item.bids.length > 0 && (
                    <button
                      className={styles.bids}
                      onClick={() => onBids(item.id)}
                    >
                      Bids
                    </button>
                  )}
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default MyAuctions;
