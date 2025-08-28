import axios from "axios";

export async function RegisterApi({
  username,
  password,
  email,
  first_name,
  last_name,
  phone_number,
  country,
  location,
  vat_number,
  role = "buyer", // default role
}) {
  try {
    const result = await axios.post("http://localhost:5000/api/auth/register", {
      username,
      password,
      email,
      first_name,
      last_name,
      phone_number,
      country,
      location,
      vat_number,
      role,
    });

    console.log("Response from RegisterApi:", result);

    if (result.status === 200) {
      return 0; // Success
    }
  } catch (err) {
    if (err.response) {
      console.error(err.response.data);
      if (err.response.status === 420) {
        return 1; // User already exists
      }
      return 2; // Other errors with response
    }
    console.error(err.message);
    return 2; // Network or unexpected errors
  }
}

function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    return null;
  }
}

export async function LoginApi(username, password) {
  try {
    const result = await axios.post("http://localhost:5000/api/auth/login", {
      username,
      password,
    });

    const token = result.data.token;
    localStorage.setItem("token", token);

    const decoded = parseJwt(token);
    console.log(decoded); // { id: ..., role: "admin", iat: ..., exp: ... }

    const userRole = decoded.role;
    return { code: 0, role: userRole };
  } catch (err) {
    if (err.response) {
      console.error(err.response.data);
      if (
        err.response.status === 400 &&
        err.response.data.msg === "User not found"
      ) {
        return { code: 1, role: null }; // user not found
      }
      if (
        err.response.status === 400 &&
        err.response.data.msg === "Invalid password"
      ) {
        return { code: 2, role: null }; // invalid password
      }
      if (err.response.status === 403) return { code: 3, role: null }; // not approved by admin

      return { code: 4, role: null }; // other backend error
    }
    console.error(err.message);
    return { code: 5, role: null }; // network or unexpected error
  }
}

export async function createAuction(auctionData) {
  const token = localStorage.getItem("token");
  console.log(token);
  if (!token || token === "undefined") {
    console.error("No token found, user not authenticated");
    return { success: false, msg: "User not authenticated" };
  }
  try {
    const res = await axios.post(
      "http://localhost:5000/api/auctions",
      auctionData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return { success: true, data: res.data };
  } catch (err) {
    console.error("Error creating auction:", err);

    if (err.response) {
      // Backend returned 4xx or 5xx
      return { success: false, msg: err.response.data.msg };
    }

    // Network or other error
    return { success: false, msg: err.message };
  }
}
// Get all auctions with optional pagination
export async function getAllAuctions() {
  try {
    const res = await axios.get("http://localhost:5000/api/auctions/all");
    return res.data; // expect { auctions: [...] }
  } catch (err) {
    console.error("Error fetching auctions:", err);
    throw err;
  }
}

export async function getAllUsers() {
  try {
    const result = await axios({
      method: "get",
      url: "http://localhost:5000/api/admin/users?approved",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        Accept: "application/json",
      },
    });
    return result.data;
  } catch (err) {
    console.error("Error fetching users:", err);
    return [];
  }
}

export async function setUserApproval(userId, approved) {
  const token = localStorage.getItem("token"); // Admin JWT
  try {
    const res = await axios.put(
      `http://localhost:5000/api/admin/users/${userId}/approve`,
      { approved }, // 0 = pending, 1 = approved
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return { success: true, msg: res.data.msg };
  } catch (err) {
    console.error("Error approving user:", err);
    if (err.response) return { success: false, msg: err.response.data.msg };
    return { success: false, msg: err.message };
  }
}
export async function setUserRole(role) {
  const token = localStorage.getItem("token");
  try {
    const res = await axios.put(
      "http://localhost:5000/api/users/me/role",
      { role },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // ✅ store the new token
    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
      console.log("New token stored:", res.data.token);
    }

    return { success: true, msg: res.data.msg, token: res.data.token };
  } catch (err) {
    console.error("Error setting own role:", err);
    if (err.response) return { success: false, msg: err.response.data.msg };
    return { success: false, msg: err.message };
  }
}
// Delete an auction by ID
export async function deleteAuction(id) {
  const token = localStorage.getItem("token");
  try {
    const res = await axios.delete(`http://localhost:5000/api/auctions/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 200) {
      return { success: true, msg: res.data.msg };
    } else {
      return {
        success: false,
        msg: res.data.msg || "Failed to delete auction",
      };
    }
  } catch (err) {
    console.error("Error deleting auction:", err);

    if (err.response) {
      return { success: false, msg: err.response.data.msg };
    }

    return { success: false, msg: err.message };
  }
}

// Update an auction by ID
export async function updateAuction(id, auctionData) {
  const token = localStorage.getItem("token");
  if (!token || token === "undefined") {
    console.error("No token found, user not authenticated");
    return { success: false, msg: "User not authenticated" };
  }

  try {
    const res = await axios.put(
      `http://localhost:5000/api/auctions/${id}`,
      auctionData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return { success: true, msg: res.data.msg, data: res.data };
  } catch (err) {
    console.error("Error updating auction:", err);

    if (err.response) {
      return { success: false, msg: err.response.data.msg };
    }

    return { success: false, msg: err.message };
  }
}

export const getUserRole = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get("http://localhost:5000/api/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { success: true, role: res.data.user.role };
  } catch (err) {
    return { success: false, msg: err.response?.data?.msg || err.message };
  }
};

export async function placeBid(itemId, amount) {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("User not authenticated");

    const res = await axios.post(
      `http://localhost:5000/api/bids/${itemId}`,
      { amount },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return { success: true, msg: res.data.msg };
  } catch (err) {
    console.error("Error placing bid:", err);
    return {
      success: false,
      msg: err.response?.data?.msg || err.message || "Error placing bid",
    };
  }
}

export const getOwnInfo = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token provided");

    const res = await axios.get("http://localhost:5000/api/users/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return { success: true, user: res.data.user };
  } catch (err) {
    console.error("Error fetching own info:", err);
    return {
      success: false,
      msg: err.response?.data?.msg || "Error fetching user info",
    };
  }
};

export const getUserById = async (id) => {
  try {
    const token = localStorage.getItem("token"); // or wherever you store it
    const res = await axios.get(`http://localhost:5000/api/users/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return { success: true, user: res.data.user };
  } catch (err) {
    console.error("Failed to fetch user:", err);
    return {
      success: false,
      msg: err.response?.data?.msg || "Error fetching user",
    };
  }
};

export async function getWonAuctions() {
  const token = localStorage.getItem("token"); // must exist
  if (!token) throw new Error("No token found");

  const res = await axios.get("http://localhost:5000/api/auctions/won", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

// Get auctions created by the logged-in user
export async function getMyAuctions() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  try {
    const res = await axios.get("http://localhost:5000/api/auctions/mine", {
      headers: { Authorization: `Bearer ${token}` },
    });

    return {
      success: true,
      auctions: res.data.auctions,
      total: res.data.total,
    };
  } catch (err) {
    console.error("Error fetching my auctions:", err);
    return {
      success: false,
      msg: err.response?.data?.msg || "Error fetching my auctions",
    };
  }
}
