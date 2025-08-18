import axios from "axios";

export async function RegisterApi({
  username,
  password,
  email,
  first_name,
  last_name,
  phone_number,
  country,
  address,
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
      address,
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

export async function CreateAuctionApi(auctionData) {
  try {
    const token = localStorage.getItem("token"); // JWT stored after login

    const result = await axios.post(
      "http://localhost:5000/api/auctions",
      {
        itemName: auctionData.name,
        categories: auctionData.categories,
        firstBid: parseFloat(auctionData.firstBid),
        buyPrice: auctionData.buyPrice
          ? parseFloat(auctionData.buyPrice)
          : null,
        location: auctionData.location,
        country: auctionData.country,
        started: auctionData.starts,
        ends: auctionData.ends,
        description: auctionData.description,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // required by verifyToken
        },
      }
    );

    console.log("Auction created:", result.data);
    return { code: 0, itemId: result.data.itemId }; // success
  } catch (err) {
    if (err.response) {
      console.error("Backend error:", err.response.data);
      if (err.response.status === 403) return { code: 1 }; // not a seller
      return { code: 2 }; // other backend error
    }
    console.error("Network or unexpected error:", err.message);
    return { code: 3 }; // network/unexpected
  }
}

// Get all auctions with optional pagination
export async function getAllAuctions(page = 1, limit = 10) {
  try {
    const response = await axios.get(
      "http://localhost:5000/api/auctions/active",
      {
        params: { page, limit },
      }
    );
    return response.data; // { auctions: [...], page, limit }
  } catch (err) {
    console.error("Error fetching auctions:", err);
    throw err; // re-throw to handle in the component
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
