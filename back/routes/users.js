const express = require("express");
const router = express.Router();

const { setOwnRole, getOwnInfo } = require("../controllers/userController");
const { verifyToken } = require("../middleware/authMiddleware.js");

// Allow logged-in users to set their own role
router.put("/me/role", verifyToken, setOwnRole);

router.get("/me", verifyToken, getOwnInfo);

module.exports = router;
