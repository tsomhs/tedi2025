const express = require("express");
const router = express.Router();

const { setOwnRole } = require("../controllers/userController"); // path correct?
const { verifyToken } = require("../middleware/authMiddleware.js");

// Allow logged-in users to set their own role
router.put("/me/role", verifyToken, setOwnRole);

module.exports = router;
