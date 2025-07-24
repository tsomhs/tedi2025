// src/pages/Home/Home.jsx
import { useNavigate } from "react-router-dom";
import styles from "./Homepage.module.css";

function Homepage() {
  const navigate = useNavigate();

  return (
    <div className={styles.hero}>
      <div className={styles.overlay}>
        <h1 className={styles.title}>Welcome to Cash or Trash</h1>
        <p className={styles.subtitle}>
          Discover, bid, and win amazing items from people around the world.
        </p>
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
