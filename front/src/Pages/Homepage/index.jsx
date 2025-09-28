// src/pages/Home/Home.jsx
import { useNavigate } from "react-router-dom";
import styles from "./Homepage.module.css";
import { setUserRole, getRecommendations } from "../../axios/auth";
import { MdMessage } from "react-icons/md";
import { useState, useEffect } from "react";
import axios from "axios";

function Homepage() {
  const navigate = useNavigate();
  const [loadingRole, setLoadingRole] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recs, setRecs] = useState([]);

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/recommendations/top",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setRecs(res.data.items || []); // ✅ fixed
        console.log(res.data);
      } catch (err) {
        console.error("Error fetching recommendations:", err);
      }
    };
    fetchRecs();
  }, []);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/messages/unread-count",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUnreadCount(res.data.unreadCount);
      } catch (err) {
        console.error("Failed to fetch unread messages:", err);
      }
    };

    fetchUnread();
  }, []);

  const handleRoleSelect = async (role) => {
    try {
      setLoadingRole(true);
      const res = await setUserRole(role);

      if (res.success) {
        // Redirect based on role
        if (role === "seller") {
          navigate("/my-auctions");
        } else {
          navigate("/browse");
        }
      } else {
        alert("Error: " + res.msg);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong!");
    } finally {
      setLoadingRole(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <span className={styles.backArrow} onClick={() => navigate("/")}>
        ←
      </span>

      <div
        className={styles.messagesIconWrapper}
        onClick={() => navigate("/messages")}
        title="Messages"
      >
        <MdMessage />
        {unreadCount > 0 && (
          <span className={styles.unreadBadge}>{unreadCount}</span>
        )}
      </div>

      <div className={styles.header}>
        <h1 className={styles.title}>&nbsp;Cash or Trash&nbsp;</h1>

        <h2 className={styles.subtitle}>
          Discover, bid, and win amazing items from people around the world —
          from rare collectibles and vintage treasures to cutting-edge gadgets
          and unique handmade creations, every auction is a chance to find
          something extraordinary.
        </h2>

        {/* Role Selection Buttons */}
        <div className={styles.buttonGroup}>
          <button
            className={styles.button}
            disabled={loadingRole}
            onClick={() => handleRoleSelect("buyer")}
          >
            🛒 Buyer
          </button>
          <button
            className={styles.button}
            disabled={loadingRole}
            onClick={() => handleRoleSelect("seller")}
          >
            📦 Seller
          </button>
          <button
            className={styles.button}
            disabled={loadingRole}
            onClick={() => handleRoleSelect("visitor")}
          >
            👀 Visitor
          </button>
        </div>
        {recs.length === 0 ? (
          <p>No recommendations yet. Start bidding!</p>
        ) : (
          <div className={styles.recsGrid}>
            <h2 className={styles.recsTitle}>Recommended for you</h2>

            {recs.map((a) => (
              <div
                key={a.id}
                className={styles.recCard}
                onClick={() => navigate(`/my-auctions/${a.id}`)}
              >
                <h3>{a.name}</h3>
                <p>Current: {a.currently || a.first_bid} </p>
                <p>Buy Price: {a.buy_price} </p>
                <p>Ends: {new Date(a.ends).toLocaleString()}</p>
                <p>Categories: {a.categories?.join(", ") || "N/A"}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Homepage;
