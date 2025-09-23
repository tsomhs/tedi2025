const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const { verifyToken } = require("../middleware/authMiddleware");

// Send a new message (create chat if chat_id not provided)
router.post("/", verifyToken, messageController.sendMessage);

// Get inbox messages
router.get("/inbox", verifyToken, messageController.getInbox);

// Get sent messages
router.get("/sent", verifyToken, messageController.getSent);

// Mark a message as read
router.put("/:id/read", verifyToken, messageController.markAsRead);

// Get unread messages count
router.get("/unread-count", verifyToken, messageController.getUnreadCount);

// Get messages in a chat
router.get("/chat/:chatId", verifyToken, messageController.getChatMessages);

// Soft delete a message
router.delete("/:id", verifyToken, messageController.deleteMessage);

module.exports = router;
