const express = require("express");
const router = express.Router();
const {
  getOwnInfo,
  setOwnRole,
  getUserById,
} = require("../controllers/userController");
const { verifyToken } = require("../middleware/authMiddleware");

// Get info about the logged-in user
router.get("/me", verifyToken, getOwnInfo);

// Change your own role
router.put("/me/role", verifyToken, setOwnRole);

// Get info about any user by ID
router.get("/:id", verifyToken, getUserById);

module.exports = router;
