import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { placeBid, getUserRole, getOwnInfo } from "../../axios/auth";
import formatDate from "../../Utils/formatDate";
import styles from "./Auction.module.css"; // CSS module
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Fix React-Leaflet default marker issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function AuctionPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [role, setRole] = useState("");
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bidError, setBidError] = useState("");
  const [coords, setCoords] = useState([0, 0]);
  const [user, setUser] = useState("");
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messageRecipient, setMessageRecipient] = useState(null);

  // Load current user
  useEffect(() => {
    const fetchUser = async () => {
      const infoRes = await getOwnInfo();
      if (infoRes.user) setUser(infoRes.user);
    };
    fetchUser();
  }, []);

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      alert("Message cannot be empty!");
      return;
    }

    let toUser =
      role === "seller" ? auction.winner.bidder_id : auction.seller.id;

    try {
      const token = localStorage.getItem("token");
      const payload = { to_user: toUser, body: messageText };

      const res = await axios.post(
        "http://localhost:5000/api/messages",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const sentMessage = res.data.message;
      setShowMessageModal(false);
      setMessageText("");
      setMessageRecipient(null);
      navigate(`/chat/${sentMessage.chat_id}`);
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message. Try again.");
    }
  };

  useEffect(() => {
    const logVisit = async () => {
      try {
        const token = localStorage.getItem("token");
        await axios.post(
          `http://localhost:5000/api/recommendations/visit/${id}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error("Failed to log visit:", err);
      }
    };

    if (id) logVisit();
  }, [id]);

  // Fetch auction + bids
  useEffect(() => {
    const fetchAuction = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/auctions/${id}`);
        setAuction(res.data);

        const bidsRes = await axios.get(`http://localhost:5000/api/bids/${id}`);
        setBids(bidsRes.data.bids);
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.msg || "Error fetching auction. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchAuction();
  }, [id]);

  useEffect(() => {
    const fetchRole = async () => {
      const res = await getUserRole();
      if (res.success) setRole(res.role);
    };
    fetchRole();
  }, []);

  // Geocode coords
  useEffect(() => {
    const getCoordsFromLocation = async (loc, country) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            `${loc}, ${country}`
          )}`
        );
        const data = await res.json();
        if (data && data.length > 0) {
          return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        }
      } catch (err) {
        console.error("Error fetching geocoded coords:", err);
      }
      return [0, 0];
    };

    const resolveCoords = async () => {
      if (auction) {
        if (auction.latitude && auction.longitude) {
          setCoords([
            parseFloat(auction.latitude),
            parseFloat(auction.longitude),
          ]);
        } else if (auction.location || auction.country) {
          const newCoords = await getCoordsFromLocation(
            auction.location || "",
            auction.country || ""
          );
          setCoords(newCoords);
        }
      }
    };

    resolveCoords();
  }, [auction]);

  if (loading) return <p className={styles.loading}>Loading auction...</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!auction) return <p className={styles.error}>Auction not found.</p>;

  const handleOpenBid = () => {
    setShowBidModal(true);
    setBidAmount("");
    setBidError("");
  };

  const handleCloseBid = () => {
    setShowBidModal(false);
    setBidAmount("");
    setBidError("");
  };

  const handleBuy = (auction) => {
    const confirmBuy = window.confirm(
      `Are you sure you want to Buy Now "${auction.name}" for $${auction.buy_price}?`
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
        const winnerData = res.data.winner || {
          username: "You",
          rating: 0,
          amount: auction.buy_price,
        };
        setAuction((prev) => ({
          ...prev,
          sold: true,
          currently: auction.buy_price,
          winner: winnerData,
        }));
        setBids((prev) => [
          {
            amount: auction.buy_price,
            time: new Date().toISOString(),
            username: winnerData.username,
            rating: winnerData.rating || 0,
          },
          ...prev,
        ]);
      })
      .catch((err) => {
        console.error(err);
        alert(err.response?.data?.msg || "Error processing Buy Now");
      });
  };

  const handlePlaceBid = async () => {
    const bidValue = parseFloat(bidAmount);
    const currentPrice = parseFloat(auction.currently || auction.first_bid);
    const buyPrice = parseFloat(auction.buy_price);

    if (isNaN(bidValue) || bidValue <= currentPrice) {
      setBidError(
        `Bid must be higher than the current price ($${currentPrice})`
      );
      return;
    }

    if (buyPrice && bidValue >= buyPrice) {
      handleBuy(auction);
      handleCloseBid();
      return;
    }

    const confirmBid = window.confirm(
      `Are you sure you want to place a bid of $${bidValue} on "${auction.name}"?`
    );
    if (!confirmBid) return;

    try {
      const result = await placeBid(auction.id, bidValue);

      if (result.success) {
        alert(result.msg);
        setAuction((prev) => ({
          ...prev,
          currently: bidValue,
          numberOfBids: (prev.numberOfBids || 0) + 1,
        }));
        setBids((prev) => [
          {
            amount: bidValue,
            time: new Date().toISOString(),
            username: "You",
            rating: 0,
          },
          ...prev,
        ]);
        setBidAmount("");
        setBidError("");
        setShowBidModal(false);
      } else {
        setBidError(result.msg);
      }
    } catch (err) {
      console.error(err);
      setBidError(
        err.response?.data?.msg || "Error placing bid. Try again later."
      );
    }
  };

  const handleOpenMessageModal = (recipient) => {
    setMessageRecipient(recipient);
    setMessageText("");
    setShowMessageModal(true);
  };

  const handleCloseMessageModal = () => {
    setShowMessageModal(false);
    setMessageText("");
    setMessageRecipient(null);
  };

  return (
    <div className={styles.container}>
      <span className={styles.backArrow} onClick={() => navigate(-1)}>
        ←
      </span>
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>{auction.name}</h1>

          <div className={styles.infoSection}>
            <p>
              <strong>First Bid:</strong> ${auction.first_bid}
            </p>
            <p>
              <strong>Current Price:</strong> $
              {auction.currently || auction.first_bid}
            </p>
            <p>
              <strong>Buy Price:</strong>{" "}
              {auction.buy_price ? `$${auction.buy_price}` : "N/A"}
            </p>
          </div>
          <div className={styles.infoSection}>
            <p>
              <strong>Start:</strong> {formatDate(auction.started)}
            </p>
            <p>
              <strong>End:</strong> {formatDate(auction.ends)}
            </p>
          </div>
          <div className={styles.infoSection}>
            <p>
              <strong>Seller:</strong> {auction.seller_username}
            </p>
            <p>
              <strong>Categories:</strong>{" "}
              {auction.categories?.join(", ") || "N/A"}
            </p>
          </div>
          <div className={styles.infoSection}>
            <p>
              <strong>Location :</strong> {auction.location || "N/A"}
            </p>
            <p>
              <strong>Country :</strong> {auction.country || "N/A"}
            </p>
          </div>
          <div className={styles.infoSection}>
            <p>
              <strong>Latitude:</strong> {auction.latitude || "N/A"}
            </p>
            <p>
              <strong>Longitude :</strong> {auction.longitude || "N/A"}
            </p>
          </div>
          <div className={styles.infoSection}>
            <p>
              <strong>Description:</strong>
            </p>
            <p className={styles.description}>
              {auction.description || "No description"}
            </p>
          </div>

          {role === "buyer" && !auction.sold && (
            <div className={styles.actionButtons}>
              <button className={styles.bidButton} onClick={handleOpenBid}>
                Place Bid
              </button>
              <button
                className={styles.buyButton}
                onClick={() => handleBuy(auction)}
              >
                Buy
              </button>
            </div>
          )}
        </div>

        <div className={styles.rightColumn}>
          {auction.sold && auction.winner && (
            <div className={styles.winnerSection}>
              <h3 className={styles.winnerTitle}>Winner</h3>
              <p className={styles.winnerName}>
                {auction.winner.username} (Rating: {auction.winner.rating})
              </p>
              <p>
                <strong>Final Price:</strong> ${auction.winner.amount}
              </p>
              {role === "seller" && (
                <button
                  className={styles.messageBuyerBtn}
                  onClick={() =>
                    handleOpenMessageModal(auction.winner.username)
                  }
                >
                  Message Buyer
                </button>
              )}
              {role === "buyer" &&
                (user.id == auction.winner_id ||
                  user.username == auction.winner.username ||
                  auction.winner.username == "You") && (
                  <button
                    className={styles.messageBuyerBtn}
                    onClick={() =>
                      handleOpenMessageModal(auction.seller_username)
                    }
                  >
                    Message Seller
                  </button>
                )}
            </div>
          )}

          <div className={styles.bidTableContainer}>
            <h3>Bids</h3>
            <table className={styles.bidTable}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Time</th>
                  {role === "seller" && (
                    <>
                      <th>location</th>
                      <th>country</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {bids.map((b, idx) => (
                  <tr key={idx} className={b.isNew ? styles.newBid : ""}>
                    <td>
                      {b.username} (Rating: {b.rating})
                    </td>
                    <td>${b.amount}</td>
                    <td>{formatDate(b.time)}</td>
                    {role === "seller" && (
                      <>
                        <td>{b.location || "N/A"}</td>
                        <td>{b.country || "N/A"}</td>
                      </>
                    )}
                  </tr>
                ))}
                {bids.length === 0 && (
                  <tr>
                    <td colSpan={role === "seller" ? 5 : 3}>No bids yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {coords[0] !== 0 && coords[1] !== 0 && (
          <div className={styles.mapWrapper}>
            <MapContainer
              center={coords}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={coords}>
                <Popup>
                  {auction.latitude && auction.longitude
                    ? `${auction.latitude}, ${auction.longitude}`
                    : `${auction.location || ""}, ${auction.country || ""}`}
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        )}
      </div>

      {showBidModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Place Your Bid on "{auction.name}"</h2>
            <input
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder={`Current: $${
                auction.currently || auction.first_bid
              }`}
            />
            {bidError && <p className={styles.bidError}>{bidError}</p>}
            <div className={styles.modalButtons}>
              <button onClick={handlePlaceBid}>Submit Bid</button>
              <button onClick={handleCloseBid}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showMessageModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Send Message to {messageRecipient}</h2>
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

export default AuctionPage;
