import { useLocation, useNavigate } from "react-router-dom";
import styles from "./UserDetails.module.css";
import { useState } from "react";
import { setUserApproval } from "../../axios/auth.jsx";

function UserDetails() {
  const navigate = useNavigate();
  const { state } = useLocation(); // passed from Admin
  const [user, setUser] = useState(state?.user || {});
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    const result = await setUserApproval(user.id, 1); // approve user
    setLoading(false);

    if (result.success) {
      setUser({ ...user, approved: 1, status: "Approved" });
      alert(`User "${user.username}" approved!`);
      navigate("/admin"); // go back to admin page
    } else {
      alert(`Failed to approve user: ${result.msg}`);
    }
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

      {user.approved !== 1 && (
        <button
          className={styles.approveBtn}
          onClick={handleApprove}
          disabled={loading}
        >
          {loading ? "Approving..." : "Approve User"}
        </button>
      )}
    </div>
  );
}

export default UserDetails;
