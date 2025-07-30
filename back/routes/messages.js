// routes/messages.js

const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { verifyToken } = require('../middleware/authMiddleware');

// Αποστολή νέου μηνύματος
router.post('/', verifyToken, messageController.sendMessage);

// Προβολή εισερχομένων
router.get('/inbox', verifyToken, messageController.getInbox);

// Προβολή απεσταλμένων
router.get('/sent', verifyToken, messageController.getSent);

// Σήμανση ως αναγνωσμένο
router.put('/:id/read', verifyToken, messageController.markAsRead);

module.exports = router;
