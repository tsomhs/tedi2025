import React, { useState } from "react";
import styles from "./MyAuctions.module.css";

const mockAuctions = [
  {
    id: "1675506221",
    name: "Tommy Hilfiger jeans boy's 18-24 M",
    categories: ["Clothing", "Infants"],
    currently: "$7.50",
    firstBid: "$7.00",
    numberOfBids: 2,
    started: "Dec-08-01 22:45:26",
    ends: "Dec-15-01 22:45:26",
    status: "Pending", // future use
  },
  {
    id: "1675506222",
    name: "iPhone 13 Pro Max 256GB",
    categories: ["Electronics", "Smartphones"],
    currently: "$950.00",
    firstBid: "$900.00",
    numberOfBids: 12,
    started: "Jul-20-25 10:00:00",
    ends: "Jul-27-25 10:00:00",
    status: "Active",
  },
  {
    id: "1675506222",
    name: "iPhone 13 Pro Max 256GB",
    categories: ["Electronics", "Smartphones"],
    currently: "$950.00",
    firstBid: "$900.00",
    numberOfBids: 12,
    started: "Jul-20-25 10:00:00",
    ends: "Jul-27-25 10:00:00",
    status: "Active",
  },
  {
    id: "1675506222",
    name: "iPhone 13 Pro Max 256GB",
    categories: ["Electronics", "Smartphones"],
    currently: "$950.00",
    firstBid: "$900.00",
    numberOfBids: 12,
    started: "Jul-20-25 10:00:00",
    ends: "Jul-27-25 10:00:00",
    status: "Active",
  },
  {
    id: "1675506222",
    name: "iPhone 13 Pro Max 256GB",
    categories: ["Electronics", "Smartphones"],
    currently: "$950.00",
    firstBid: "$900.00",
    numberOfBids: 12,
    started: "Jul-20-25 10:00:00",
    ends: "Jul-27-25 10:00:00",
    status: "Active",
  },
  {
    id: "1675506222",
    name: "iPhone 13 Pro Max 256GB",
    categories: ["Electronics", "Smartphones"],
    currently: "$950.00",
    firstBid: "$900.00",
    numberOfBids: 12,
    started: "Jul-20-25 10:00:00",
    ends: "Jul-27-25 10:00:00",
    status: "Active",
  },
  {
    id: "1675506222",
    name: "iPhone 13 Pro Max 256GB",
    categories: ["Electronics", "Smartphones"],
    currently: "$950.00",
    firstBid: "$900.00",
    numberOfBids: 12,
    started: "Jul-20-25 10:00:00",
    ends: "Jul-27-25 10:00:00",
    status: "Active",
  },
];

function MyAuctions() {
  const [auctions, setAuctions] = useState(mockAuctions);

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

            <div className={styles.cardActions}>
              <button className={styles.edit}>Edit</button>
              <button className={styles.delete}>Delete</button>
              <button className={styles.start}>Start</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyAuctions;
