import { Link } from "react-router-dom";
import styles from "./PendingApproval.module.css";

function PendingApproval() {
  return (
    <div className={styles.card}>
      <h1>Registration Pending Approval</h1>
      <p>
        Your sign-up request has been successfully submitted and is currently
        awaiting approval from the administrator.
      </p>
      <Link to="/" className={styles.link}>
        Return
      </Link>
    </div>
  );
}

export default PendingApproval;
