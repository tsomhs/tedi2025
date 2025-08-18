import { useState, useEffect } from "react";
import styles from "./Admin.module.css";
import { useNavigate } from "react-router-dom";
import { getAllUsers } from "../../axios/auth.jsx";

function Admin() {
  const [users, setUsers] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      const data = await getAllUsers();
      setUsers(data);
    };
    fetchUsers();
  }, []);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleRowClick = (user) => {
    navigate(`/admin/user/${user.id}`, { state: { user } });
  };

  // Safe highlight function returning JSX
  const highlightMatch = (text, query) => {
    if (!query) return text;
    const parts = text.toString().split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className={styles.highlight}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const filteredUsers = users
    .map((user) => ({
      user,
      match: Object.values({
        ...user,
        approved: user.approved === 1 ? "Approved" : "Pending", // consider status text for search
      }).some((value) =>
        value.toString().toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .sort((a, b) => {
      if (a.match && !b.match) return -1;
      if (!a.match && b.match) return 1;

      let valA = a.user[sortConfig.key];
      let valB = b.user[sortConfig.key];

      // Only convert approved to text
      if (sortConfig.key === "approved") {
        valA = valA === 1 ? "Approved" : "Pending";
        valB = valB === 1 ? "Approved" : "Pending";
      }

      const isNumber = !isNaN(valA) && !isNaN(valB);

      if (isNumber) {
        return sortConfig.direction === "asc"
          ? Number(valA) - Number(valB)
          : Number(valB) - Number(valA);
      } else {
        return sortConfig.direction === "asc"
          ? valA.toString().localeCompare(valB.toString())
          : valB.toString().localeCompare(valA.toString());
      }
    })
    .map(({ user }) => user);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.backArrow} onClick={() => navigate("/")}>
          ←
        </span>
        <h1 className={styles.pageTitle}>Admin Page</h1>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            {["id", "username", "email", "approved"].map((key) => (
              <th
                key={key}
                onClick={() => handleSort(key)}
                className={styles.sortableHeader}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
                {sortConfig.key === key && (
                  <span className={styles.arrow}>
                    {sortConfig.direction === "asc" ? " ▲" : " ▼"}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {filteredUsers.map((user) => (
            <tr
              key={user.id}
              className={styles.row}
              onClick={() => handleRowClick(user)}
            >
              <td>{highlightMatch(user.id, searchQuery)}</td>
              <td>{highlightMatch(user.username, searchQuery)}</td>
              <td>{highlightMatch(user.email, searchQuery)}</td>
              <td>
                <span
                  className={
                    user.approved === 1
                      ? styles.badgeApproved
                      : styles.badgePending
                  }
                >
                  {highlightMatch(
                    user.approved === 1 ? "Approved" : "Pending",
                    searchQuery
                  )}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Admin;
