const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const recommendationController = require("../controllers/recommendationController");

// Πάρε top-N προτάσεις για τον current user
router.get("/top", verifyToken, recommendationController.getTopRecommendations);

//Log επίσκεψης item (implicit feedback)
router.post("/visit/:itemId", verifyToken, recommendationController.logVisit);

module.exports = router;
