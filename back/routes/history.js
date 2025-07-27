const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const { verifyToken } = require('../middleware/authMiddleware');

// Καταγραφή επίσκεψης
router.post('/:itemId', verifyToken, historyController.logView);

// Προτάσεις βάσει ιστορικού
router.get('/recommendations', verifyToken, historyController.getRecommendations);

module.exports = router;