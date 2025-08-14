import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import formatDate from "../../Utils/formatDate";
import styles from "./Auction.module.css"; // new CSS module

function AuctionPage() {
  const { id } = useParams();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAuction = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/auctions/${id}`);
        setAuction(res.data);
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

  if (loading) return <p className={styles.loading}>Loading auction...</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!auction) return <p className={styles.error}>Auction not found.</p>;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>{auction.name}</h1>

        <div className={styles.infoSection}>
          <p>
            <strong>Seller:</strong> {auction.seller_username}
          </p>
          <p>
            <strong>Categories:</strong>{" "}
            {auction.categories?.join(", ") || "N/A"}
          </p>
          <p>
            <strong>Status:</strong> {auction.status || "Pending"}
          </p>
        </div>

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
            <strong>Description:</strong>
          </p>
          <p className={styles.description}>
            {auction.description || "No description"}
          </p>
        </div>

        <div className={styles.infoSection}>
          <p>
            <strong>Start:</strong> {formatDate(auction.started)}
          </p>
          <p>
            <strong>End:</strong> {formatDate(auction.ends)}
          </p>
          <p>
            <strong>Location:</strong> {auction.location || "N/A"},{" "}
            {auction.country || "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuctionPage;
