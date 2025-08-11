// src/pages/Home/Home.jsx
import { useNavigate } from "react-router-dom";
import styles from "./Homepage.module.css";

function Homepage() {
  const navigate = useNavigate();

  return (
    <div className={styles.overlay}>
      <span className={styles.backArrow} onClick={() => navigate("/")}>
        ←
      </span>
      <div className={styles.header}>
        <h1 className={styles.title}>&nbsp;Cash or Trash &nbsp;</h1>

        <h1 className={styles.subtitle}>
          Discover, bid, and win amazing items from people around the world —
          from rare collectibles and vintage treasures to cutting-edge gadgets
          and unique handmade creations, every auction is a chance to find
          something extraordinary.
        </h1>
        <div className={styles.buttonGroup}>
          <button className={styles.button} onClick={() => navigate("/browse")}>
            🔍 Browse Auctions
          </button>
          <button
            className={styles.button}
            onClick={() => navigate("/my-auctions")}
          >
            📦 Manage My Auctions
          </button>
        </div>
      </div>
    </div>
  );
}

export default Homepage;
