// src/Pages/AuctionsBought/index.jsx
import React, { useEffect, useState } from "react";
import styles from "./AuctionsBought.module.css";
import { getWonAuctions } from "../../axios/auth";
import { useNavigate } from "react-router-dom";

function AuctionsBought() {
  const navigate = useNavigate();

  const [wonAuctions, setWonAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchWon() {
      try {
        const data = await getWonAuctions();
        setWonAuctions(data);
      } catch (err) {
        console.error("Error fetching won auctions:", err);
        setError("Failed to load auctions");
      } finally {
        setLoading(false);
      }
    }
    fetchWon();
  }, []);

  if (loading) return <div className={styles.loader}>Loading...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.header}>
        <span
          className={styles.backArrow}
          onClick={() => navigate("/browse", { replace: true })}
        >
          ←
        </span>
        <h2>My Won Auctions</h2>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.auctionTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Seller</th>
              <th>Final Price</th>
              <th>Ended</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {wonAuctions.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center" }}>
                  No auctions won yet
                </td>
              </tr>
            ) : (
              wonAuctions.map((auction) => (
                <tr key={auction.id}>
                  <td>{auction.name}</td>
                  <td>{auction.seller_name}</td>
                  <td>{auction.final_price}</td>
                  <td>{new Date(auction.ends).toLocaleString()}</td>
                  <td>
                    <button
                      className={styles.messageBtn}
                      onClick={() =>
                        alert("Messaging seller: " + auction.seller_name)
                      }
                    >
                      Message Seller
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AuctionsBought;
