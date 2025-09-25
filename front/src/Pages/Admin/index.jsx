import { useState, useEffect, useMemo } from "react";
import styles from "./Admin.module.css";
import { useNavigate } from "react-router-dom";
import { getAllUsers, getAllAuctions } from "../../axios/auth.jsx";

function Admin() {
  const [users, setUsers] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Fetch users and create lightweight array with fullData
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getAllUsers();
        const lightweight = data.map((u) => ({
          id: u.id,
          username: u.username,
          email: u.email,
          approved: u.approved,
          fullData: u, // store full user object
        }));
        setUsers(lightweight);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
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
    // Navigate with full user data
    navigate(`/admin/user/${user.id}`, { state: { user: user.fullData } });
  };

  // Safe highlightMatch function
  const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // escape regex
    const parts = text.toString().split(new RegExp(`(${escaped})`, "gi"));
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

  // Memoized filtered & sorted users
  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => {
        const valuesToCheck = {
          id: user.id,
          username: user.username,
          approved: user.approved === 1 ? "Approved" : "Pending",
        };

        // Include email only if id <= 8 or id >= 13430
        if (user.id <= 8 || user.id >= 13430) {
          valuesToCheck.email = user.email;
        }

        return Object.values(valuesToCheck).some((value) =>
          (value ?? "")
            .toString()
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        );
      })
      .sort((a, b) => {
        let valA = a[sortConfig.key] ?? "";
        let valB = b[sortConfig.key] ?? "";

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
      });
  }, [users, searchQuery, sortConfig]);

  const exportAuctionsJSON = async () => {
    try {
      const data = await getAllAuctions();
      const jsonStr = JSON.stringify(data, null, 2);

      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "auctions.json";
      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting JSON:", err);
    }
  };

  const exportAuctionsXML = async () => {
    try {
      const data = await getAllAuctions();

      let xml = "<auctions>\n";
      data.auctions.forEach((a) => {
        xml += `  <auction>\n`;
        Object.entries(a).forEach(([key, value]) => {
          xml += `    <${key}>${value ?? ""}</${key}>\n`;
        });
        xml += `  </auction>\n`;
      });
      xml += "</auctions>";

      const blob = new Blob([xml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "auctions.xml";
      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting XML:", err);
    }
  };

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
        <div className={styles.exportButtons}>
          <button onClick={exportAuctionsJSON} className={styles.exportBtn}>
            Export JSON
          </button>
          <button onClick={exportAuctionsXML} className={styles.exportBtn}>
            Export XML
          </button>
        </div>
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
              <td>
                {user.email ? highlightMatch(user.email, searchQuery) : "-"}
              </td>
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
