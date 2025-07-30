const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { verifyToken } = require('../middleware/authMiddleware');

// Υποβολή αξιολόγησης (π.χ. seller αξιολογεί bidder ή αντίστροφα)
router.post('/', verifyToken, ratingController.submitRating);

// Προβολή αξιολογήσεων χρήστη (ως seller ή bidder)
router.get('/:userId', ratingController.getRatingsForUser);

module.exports = router;
