import { useState } from "react";
import styles from "./Admin.module.css";
import { useNavigate } from "react-router-dom";
import user from "../../constants/Structs.js";

const fakeUsers = [
  {
    ...user,
    id: 1,
    username: "john_doe",
    email: "john@example.com",
    status: "Approved",
    firstName: "John",
    lastName: "Doe",
    phoneNumber: "1234567890",
    country: "USA",
    address: "123 Main St",
    vatNumber: "US12345678",
  },
  {
    ...user,
    id: 2,
    username: "jane_smith",
    email: "jane@example.com",
    status: "Pending approval",
    firstName: "Jane",
    lastName: "Smith",
    phoneNumber: "2345678901",
    country: "Canada",
    address: "456 Maple Ave",
    vatNumber: "CA87654321",
  },
  {
    ...user,
    id: 3,
    username: "alex_m",
    email: "alex@example.com",
    status: "Approved",
    firstName: "Alex",
    lastName: "Morgan",
    phoneNumber: "3456789012",
    country: "UK",
    address: "789 Oxford Rd",
    vatNumber: "UK34567890",
  },
  {
    ...user,
    id: 4,
    username: "sara_k",
    email: "sara@example.com",
    status: "Pending approval",
    firstName: "Sara",
    lastName: "Khan",
    phoneNumber: "4567890123",
    country: "Germany",
    address: "12 Berlin Str.",
    vatNumber: "DE45678901",
  },
  {
    ...user,
    id: 5,
    username: "michael_b",
    email: "michael@example.com",
    status: "Approved",
    firstName: "Michael",
    lastName: "Brown",
    phoneNumber: "5678901234",
    country: "Australia",
    address: "101 Sydney Ave",
    vatNumber: "AU56789012",
  },
  {
    ...user,
    id: 6,
    username: "linda_w",
    email: "linda@example.com",
    status: "Approved",
    firstName: "Linda",
    lastName: "White",
    phoneNumber: "6789012345",
    country: "USA",
    address: "99 Liberty St",
    vatNumber: "US67890123",
  },
  {
    ...user,
    id: 7,
    username: "tom_h",
    email: "tom@example.com",
    status: "Pending approval",
    firstName: "Tom",
    lastName: "Hanks",
    phoneNumber: "7890123456",
    country: "Canada",
    address: "55 Maplewood Ln",
    vatNumber: "CA78901234",
  },
  {
    ...user,
    id: 8,
    username: "nina_r",
    email: "nina@example.com",
    status: "Approved",
    firstName: "Nina",
    lastName: "Rodriguez",
    phoneNumber: "8901234567",
    country: "Spain",
    address: "Calle Gran Via 10",
    vatNumber: "ES89012345",
  },
  {
    ...user,
    id: 9,
    username: "george_c",
    email: "george@example.com",
    status: "Pending approval",
    firstName: "George",
    lastName: "Clark",
    phoneNumber: "9012345678",
    country: "France",
    address: "22 Rue Lafayette",
    vatNumber: "FR90123456",
  },
  {
    ...user,
    id: 10,
    username: "emma_t",
    email: "emma@example.com",
    status: "Approved",
    firstName: "Emma",
    lastName: "Taylor",
    phoneNumber: "0123456789",
    country: "Italy",
    address: "Via Roma 8",
    vatNumber: "IT01234567",
  },
  {
    ...user,
    id: 11,
    username: "david_g",
    email: "david@example.com",
    status: "Pending approval",
    firstName: "David",
    lastName: "Green",
    phoneNumber: "1122334455",
    country: "Ireland",
    address: "4 St. Patrick Rd",
    vatNumber: "IE11223344",
  },
  {
    ...user,
    id: 12,
    username: "olivia_m",
    email: "olivia@example.com",
    status: "Approved",
    firstName: "Olivia",
    lastName: "Martinez",
    phoneNumber: "2233445566",
    country: "Portugal",
    address: "Av. da Liberdade 20",
    vatNumber: "PT22334455",
  },
  {
    ...user,
    id: 13,
    username: "ethan_b",
    email: "ethan@example.com",
    status: "Pending approval",
    firstName: "Ethan",
    lastName: "Brown",
    phoneNumber: "3344556677",
    country: "Netherlands",
    address: "Keizersgracht 123",
    vatNumber: "NL33445566",
  },
];

function Admin() {
  const [users] = useState(fakeUsers);
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleRowClick = (user) => {
    console.log("User details:", user);
    navigate(`/admin/user/${user.id}`, { state: { user } });
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, "gi");
    return text.replace(regex, `<mark class="${styles.highlight}">$1</mark>`);
  };

  const filteredUsers = users
    .map((user) => ({
      user,
      match: Object.values(user).some((value) =>
        value.toString().toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .sort((a, b) => {
      if (a.match && !b.match) return -1;
      if (!a.match && b.match) return 1;

      const valA = a.user[sortConfig.key];
      const valB = b.user[sortConfig.key];

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

    .map(({ user }) => user); // Return clean users

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
            {["id", "username", "email", "status"].map((key) => (
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
              <td
                dangerouslySetInnerHTML={{
                  __html: highlightMatch(user.id.toString(), searchQuery),
                }}
              />
              <td
                dangerouslySetInnerHTML={{
                  __html: highlightMatch(user.username, searchQuery),
                }}
              />
              <td
                dangerouslySetInnerHTML={{
                  __html: highlightMatch(user.email, searchQuery),
                }}
              />
              <td>
                <span
                  className={
                    user.status === "Approved"
                      ? styles.badgeApproved
                      : styles.badgePending
                  }
                  dangerouslySetInnerHTML={{
                    __html: highlightMatch(user.status, searchQuery),
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Admin;
