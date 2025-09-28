// routes/auctions.js

const express = require("express");
const router = express.Router();
const auctionController = require("../controllers/auctionController");
const { verifyToken } = require("../middleware/authMiddleware");

// Επιστροφή ενεργών δημοπρασιών (με σελιδοποίηση)
router.get("/active", auctionController.getActiveAuctions);

router.get("/completed", auctionController.getCompletedAuctions);

router.get("/active", auctionController.getActiveAuctions);

router.get("/count", auctionController.getAuctionCounts);

// Αναζήτηση δημοπρασιών με φίλτρα
router.get("/search", auctionController.searchAuctions);

router.get(
  "/recommendations",
  verifyToken,
  auctionController.getRecommendations
);

// Route δοκιμής
router.get("/", (req, res) => {
  res.send("Η route /api/auctions λειτουργεί σωστά");
});
router.get("/mine", verifyToken, auctionController.getUserAuctions);

router.get("/won", verifyToken, auctionController.getWonAuctions);

router.post("/buy/:id", verifyToken, auctionController.buyNow);

// Προβολή όλων των δημοπρασιών (χωρίς φίλτρα)
router.get("/all", auctionController.getAllAuctions);

// Προβολή δημοπρασίας με ID (όλοι)
router.get("/:id", auctionController.getAuctionById);

// Δημιουργία νέας δημοπρασίας (μόνο για sellers)
router.post("/", verifyToken, auctionController.createAuction);

// Επεξεργασία δημοπρασίας (μόνο ο πωλητής)
router.put("/:id", verifyToken, auctionController.updateAuction);

// Διαγραφή δημοπρασίας (μόνο ο πωλητής, πριν ξεκινήσει)
router.delete("/:id", verifyToken, auctionController.deleteAuction);

module.exports = router;
