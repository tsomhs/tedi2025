import axios from "axios";

// Auth
export async function RegisterApi(user) {
  try {
    const result = await axios.post(
      "http://localhost:5000/api/auth/register",
      user
    );
    return result.status === 200 ? 0 : 2;
  } catch (err) {
    if (err.response?.status === 420) return 1; // user exists
    return 2;
  }
}

function parseJwt(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
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
    return { code: 0, role: decoded.role };
  } catch (err) {
    if (!err.response) return { code: 5, role: null };
    const { status, data } = err.response;
    if (status === 400 && data.msg === "User not found")
      return { code: 1, role: null };
    if (status === 400 && data.msg === "Invalid password")
      return { code: 2, role: null };
    if (status === 403) return { code: 3, role: null };
    return { code: 4, role: null };
  }
}

// Auctions
export async function createAuction(auctionData) {
  const token = localStorage.getItem("token");
  if (!token) return { success: false, msg: "Not authenticated" };
  try {
    const res = await axios.post(
      "http://localhost:5000/api/auctions",
      auctionData,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, msg: err.response?.data?.msg || err.message };
  }
}

export const getAllAuctions = (page, limit) =>
  axios
    .get(`http://localhost:5000/api/auctions/all?page=${page}&limit=${limit}`)
    .then((r) => r.data);

export const getActiveAuctions = (params = {}) =>
  axios
    .get(`http://localhost:5000/api/auctions/active`, { params })
    .then((r) => r.data);

export const getCompletedAuctions = (params = {}) =>
  axios
    .get(`http://localhost:5000/api/auctions/completed`, { params })
    .then((r) => r.data);

export const getAuctionCounts = () =>
  axios.get(`http://localhost:5000/api/auctions/count`).then((r) => r.data);

export async function deleteAuction(id) {
  const token = localStorage.getItem("token");
  try {
    const res = await axios.delete(`http://localhost:5000/api/auctions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { success: res.status === 200, msg: res.data.msg };
  } catch (err) {
    return { success: false, msg: err.response?.data?.msg || err.message };
  }
}

export async function updateAuction(id, auctionData) {
  const token = localStorage.getItem("token");
  if (!token) return { success: false, msg: "Not authenticated" };
  try {
    const res = await axios.put(
      `http://localhost:5000/api/auctions/${id}`,
      auctionData,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return { success: true, msg: res.data.msg, data: res.data };
  } catch (err) {
    return { success: false, msg: err.response?.data?.msg || err.message };
  }
}

// Users
export async function getAllUsers() {
  try {
    const res = await axios.get(
      "http://localhost:5000/api/admin/users?approved",
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    );
    return res.data;
  } catch {
    return [];
  }
}

export async function setUserApproval(userId, approved) {
  const token = localStorage.getItem("token");
  try {
    const res = await axios.put(
      `http://localhost:5000/api/admin/users/${userId}/approve`,
      { approved },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { success: true, msg: res.data.msg };
  } catch (err) {
    return { success: false, msg: err.response?.data?.msg || err.message };
  }
}

export async function setUserRole(role) {
  const token = localStorage.getItem("token");
  try {
    const res = await axios.put(
      "http://localhost:5000/api/users/me/role",
      { role },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.data.token) localStorage.setItem("token", res.data.token);
    return { success: true, msg: res.data.msg, token: res.data.token };
  } catch (err) {
    return { success: false, msg: err.response?.data?.msg || err.message };
  }
}

export const getUserRole = async () => {
  try {
    const res = await axios.get("http://localhost:5000/api/users/me", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    return { success: true, role: res.data.user.role };
  } catch (err) {
    return { success: false, msg: err.response?.data?.msg || err.message };
  }
};

export const getOwnInfo = async () => {
  try {
    const res = await axios.get("http://localhost:5000/api/users/me", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    return { success: true, user: res.data.user };
  } catch (err) {
    return {
      success: false,
      msg: err.response?.data?.msg || "Error fetching user info",
    };
  }
};

export const getUserById = async (id) => {
  try {
    const res = await axios.get(`http://localhost:5000/api/users/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    return { success: true, user: res.data.user };
  } catch (err) {
    return {
      success: false,
      msg: err.response?.data?.msg || "Error fetching user",
    };
  }
};

// Bids
export async function placeBid(itemId, amount) {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.post(
      `http://localhost:5000/api/bids/${itemId}`,
      { amount },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { success: true, msg: res.data.msg };
  } catch (err) {
    return { success: false, msg: err.response?.data?.msg || err.message };
  }
}

// User Auctions
export async function getWonAuctions() {
  const token = localStorage.getItem("token");
  const res = await axios.get("http://localhost:5000/api/auctions/won", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function getMyAuctions() {
  const token = localStorage.getItem("token");
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
    return {
      success: false,
      msg: err.response?.data?.msg || "Error fetching my auctions",
    };
  }
}

// Recommendations
export async function getRecommendations() {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get(
      "http://localhost:5000/api/recommendations/top",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  } catch (err) {
    return {
      success: false,
      msg: err.response?.data?.msg || "Error fetching recommendations",
      recommendations: [],
    };
  }
}
