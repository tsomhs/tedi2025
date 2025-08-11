import axios from "axios";

export async function RegisterApi(username, password, email) {
  try {
    const result = await axios.post("http://localhost:5000/api/auth/register", {
      username,
      password,
      email,
    });

    console.log("Response from RegisterApi:", result);

    if (result.status === 200) {
      return 0; // Success
    }
  } catch (err) {
    // Axios error responses are in err.response
    if (err.response) {
      console.error(err.response.data);
      if (err.response.status === 409) {
        return 1; // User already exists
      }
      return 2; // Other errors with response
    }
    console.error(err.message);
    return 2; // Network or unexpected errors
  }
}

export async function LoginApi(username, password) {
  try {
    const result = await axios.post("http://localhost:5000/api/auth/login", {
      username,
      password,
    });

    console.log(result.data); // token here

    localStorage.setItem("token", result.data.token);

    // Decode the JWT to get user info
    const decoded = jwtDecode(token);
    const userRole = decoded.role;

    return { code: 0, role: userRole }; // success
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
