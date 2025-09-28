const express = require("express");
const router = express.Router();
const bidController = require("../controllers/bidController");
const { verifyToken } = require("../middleware/authMiddleware");

// Υποβολή προσφοράς σε συγκεκριμένο item
router.post("/:itemId", verifyToken, bidController.placeBid);

router.get("/:itemId", bidController.getBidsForItem);

module.exports = router;
