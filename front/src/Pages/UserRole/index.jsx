import { useNavigate } from "react-router-dom";
import styles from "./UserRole.module.css";
import { setUserRole } from "../../axios/auth";

function UserRole() {
  const navigate = useNavigate();

  const handleRoleSelect = async (role) => {
    const res = await setUserRole(role);

    if (res.success) {
      console.log(res.msg);
      navigate("/home");
    } else {
      alert("Error: " + res.msg);
    }
  };

  return (
    <div className={styles.container}>
      <span className={styles.backArrow} onClick={() => navigate("/")}>
        ←
      </span>

      <div className={styles.header}>
        <h1 className={styles.title}>Cash or Trash</h1>
        <h2 className={styles.subtitle}>Continue as:</h2>

        <div className={styles.buttonGroup}>
          <button
            className={styles.button}
            onClick={() => handleRoleSelect("buyer")}
          >
            🛒 Buyer
          </button>
          <button
            className={styles.button}
            onClick={() => handleRoleSelect("seller")}
          >
            📦 Seller
          </button>
          <button
            className={styles.button}
            onClick={() => handleRoleSelect("visitor")}
          >
            👀 Visitor
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserRole;
