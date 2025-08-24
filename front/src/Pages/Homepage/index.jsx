// src/pages/Home/Home.jsx
import { useNavigate } from "react-router-dom";
import styles from "./Homepage.module.css";
import { setUserRole } from "../../axios/auth";
import { useState } from "react";

function Homepage() {
  const navigate = useNavigate();
  const [loadingRole, setLoadingRole] = useState(false);

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
      </div>
    </div>
  );
}

export default Homepage;
