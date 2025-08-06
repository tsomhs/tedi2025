import React, { useState, useEffect } from "react";
import styles from "./MyAuctions.module.css";
import auctionData from "../../constants/auctions";

function MyAuctions() {
  const [auctions, setAuctions] = useState([]);

  useEffect(() => {
    // Simulate fetching data
    setAuctions(auctionData);
  }, []);
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>My Auctions</h1>
      <button className={styles.newAuctionBtn}>+ New Auction</button>

      <div className={styles.auctionList}>
        {auctions.map((item) => (
          <div key={item.id} className={styles.card}>
            <h2>{item.name}</h2>
            <p>
              <strong>Categories:</strong> {item.categories.join(", ")}
            </p>
            <p>
              <strong>Starting Price:</strong> {item.firstBid}
            </p>
            <p>
              <strong>Current Price:</strong> {item.currently}
            </p>
            <p>
              <strong>Bids:</strong> {item.numberOfBids}
            </p>
            <p>
              <strong>Start:</strong> {item.started}
            </p>
            <p>
              <strong>End:</strong> {item.ends}
            </p>
            <p>
              <strong>Status:</strong> {item.status}
            </p>
            <p>
              <strong>Location:</strong> {item.location}
            </p>
            <p>
              <strong>Country:</strong> {item.country}
            </p>
            <p>
              <strong>Seller:</strong> {item.seller.userID} (Rating:{" "}
              {item.seller.rating})
            </p>
            <p>
              <strong>Description:</strong> {item.description}
            </p>

            <div className={styles.cardActions}>
              {item.status === "Pending" && (
                <>
                  {item.bids.length === 0 && (
                    <>
                      <button className={styles.edit}>Edit</button>
                      <button className={styles.delete}>Delete</button>
                    </>
                  )}
                  <button className={styles.start}>Start</button>
                </>
              )}
            </div>

            {/* Optional: Show bids */}
            {item.bids?.length > 0 && (
              <div className={styles.bids}>
                <h3>Bids</h3>
                <ul>
                  {item.bids.map((bid, idx) => (
                    <li key={idx}>
                      {bid.amount} by {bid.bidder.userID} at {bid.time} from{" "}
                      {bid.bidder.country}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyAuctions;
