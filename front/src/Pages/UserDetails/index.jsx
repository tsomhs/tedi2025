import { useLocation, useNavigate } from "react-router-dom";
import styles from "./UserDetails.module.css";
import UserStruct from "../../constants/userStruct";
import { useState } from "react";

function UserDetails() {
  const navigate = useNavigate();
  const { state } = useLocation(); // passed from Admin
  const [user, setUser] = useState(state?.user || UserStruct);

  const handleApprove = () => {
    // Simulate approval (replace this with an API call later)
    const updatedUser = { ...user, status: "Approved" };
    setUser(updatedUser);

    // Optional: show confirmation or navigate back
    alert(`User "${user.username}" approved!`);
  };

  return (
    <div className={styles.container}>
      <button onClick={() => navigate(-1)} className={styles.backBtn}>
        ← Back
      </button>
      <h1>User Details</h1>

      <div className={styles.userDetails}>
        {Object.entries(user)
          .filter(([key]) => key !== "password" && key !== "confirmedPassword")
          .map(([key, value]) => (
            <div key={key} className={styles.detailRow}>
              <span className={styles.label}>{key}</span>
              <span className={styles.value}>{value}</span>
            </div>
          ))}
      </div>

      {user.status !== "Approved" && (
        <button className={styles.approveBtn} onClick={handleApprove}>
          Approve User
        </button>
      )}
    </div>
  );
}

export default UserDetails;
