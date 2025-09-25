// controllers/messageController.js

const db = require("../config/db");

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const from_user = req.user.id;
    const { to_user, subject, body, chat_id } = req.body;

    if (!to_user || !body) {
      return res
        .status(400)
        .json({ msg: "Recipient and message body are required" });
    }

    let finalChatId = chat_id;

    // If no chat_id provided, check if a conversation already exists
    if (!finalChatId) {
      const [[existingChat]] = await db.promise().query(
        `SELECT chat_id 
           FROM messages 
          WHERE ((from_user = ? AND to_user = ?) OR (from_user = ? AND to_user = ?))
            AND deleted_by_sender = 0 AND deleted_by_receiver = 0
          ORDER BY sent_at ASC 
          LIMIT 1`,
        [from_user, to_user, to_user, from_user]
      );

      if (existingChat) {
        finalChatId = existingChat.chat_id;
      } else {
        // Generate new chat_id
        const [[maxChat]] = await db
          .promise()
          .query(`SELECT MAX(chat_id) AS maxChatId FROM messages`);
        finalChatId = (maxChat.maxChatId || 0) + 1;
      }
    }

    // Insert message with chat_id
    const [result] = await db.promise().query(
      `INSERT INTO messages (from_user, to_user, subject, body, chat_id)
       VALUES (?, ?, ?, ?, ?)`,
      [from_user, to_user, subject || null, body, finalChatId]
    );

    // Fetch inserted message
    const [[message]] = await db.promise().query(
      `SELECT * 
           FROM messages 
          WHERE id = ? AND deleted_by_sender = 0 AND deleted_by_receiver = 0`,
      [result.insertId]
    );

    res.json({ msg: "Message sent successfully", message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error sending message", err });
  }
};

// Get inbox messages
exports.getInbox = async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT m.id, m.chat_id, m.from_user, m.to_user, 
             u.username AS sender_username,
             m.body, m.sent_at, m.is_read
      FROM messages m
      JOIN users u ON m.from_user = u.id
      WHERE m.to_user = ?
        AND m.deleted_by_receiver = 0
      ORDER BY m.sent_at DESC
    `;

    const [inbox] = await db.promise().query(query, [userId]);

    res.json({ inbox });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error fetching inbox", err });
  }
};

// Get sent messages
exports.getSent = async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT m.id, m.chat_id, m.from_user, m.to_user, 
             u.username AS recipient_username,
             m.body, m.sent_at, m.is_read
      FROM messages m
      JOIN users u ON m.to_user = u.id
      WHERE m.from_user = ?
        AND m.deleted_by_sender = 0
      ORDER BY m.sent_at DESC
    `;

    const [sent] = await db.promise().query(query, [userId]);

    res.json({ sent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error fetching sent messages", err });
  }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const messageId = req.params.id;

    await db.promise().query(
      `UPDATE messages
          SET is_read = 1
        WHERE id = ? AND to_user = ? 
          AND deleted_by_receiver = 0`,
      [messageId, userId]
    );

    res.json({ msg: "Message marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error updating message status", err });
  }
};

// Get conversation with a specific user
exports.getConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const otherUserId = parseInt(req.params.userId);

    const query = `
      SELECT m.id, m.from_user, m.to_user, u1.username AS from_username, u2.username AS to_username,
             m.subject, m.body, m.sent_at, m.is_read
      FROM messages m
      JOIN users u1 ON m.from_user = u1.id
      JOIN users u2 ON m.to_user = u2.id
      WHERE ((m.from_user = ? AND m.to_user = ?) OR (m.from_user = ? AND m.to_user = ?))
        AND ((m.from_user = ? AND m.deleted_by_sender = 0) OR (m.to_user = ? AND m.deleted_by_receiver = 0))
      ORDER BY m.sent_at ASC`;

    const [messages] = await db
      .promise()
      .query(query, [userId, otherUserId, otherUserId, userId, userId, userId]);

    // Mark all messages from the other user as read
    await db.promise().query(
      `UPDATE messages 
          SET is_read = 1 
        WHERE from_user = ? AND to_user = ? 
          AND deleted_by_receiver = 0`,
      [otherUserId, userId]
    );

    res.json({ messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error loading conversation", err });
  }
};

// Soft delete a message
exports.deleteMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const messageId = parseInt(req.params.id);

    const [[msg]] = await db
      .promise()
      .query(`SELECT * FROM messages WHERE id = ?`, [messageId]);

    if (!msg) return res.status(404).json({ msg: "Message not found" });

    if (msg.from_user === userId) {
      await db
        .promise()
        .query(`UPDATE messages SET deleted_by_sender = 1 WHERE id = ?`, [
          messageId,
        ]);
    } else if (msg.to_user === userId) {
      await db
        .promise()
        .query(`UPDATE messages SET deleted_by_receiver = 1 WHERE id = ?`, [
          messageId,
        ]);
    } else {
      return res.status(403).json({ msg: "Not authorized" });
    }

    res.json({ msg: "Message deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error deleting message", err });
  }
};

// Get count of unread messages
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT COUNT(*) AS unreadCount
      FROM messages
      WHERE to_user = ? 
        AND is_read = 0 
        AND deleted_by_receiver = 0
    `;

    const [[{ unreadCount }]] = await db.promise().query(query, [userId]);

    res.json({ unreadCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error fetching unread messages count", err });
  }
};

// Get messages in a specific chat
exports.getChatMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const chatId = parseInt(req.params.chatId);

    const query = `
      SELECT m.id, m.from_user, m.to_user, 
             u1.username AS from_username, 
             u2.username AS to_username,
             m.body, m.sent_at, m.is_read
      FROM messages m
      JOIN users u1 ON m.from_user = u1.id
      JOIN users u2 ON m.to_user = u2.id
      WHERE m.chat_id = ?
        AND (
          (m.from_user = ? AND m.deleted_by_sender = 0) OR
          (m.to_user = ? AND m.deleted_by_receiver = 0)
        )
      ORDER BY m.sent_at ASC
    `;

    const [results] = await db.promise().query(query, [chatId, userId, userId]);

    // Mark all messages **from the other user** as read
    await db.promise().query(
      `UPDATE messages 
          SET is_read = 1 
        WHERE chat_id = ? 
          AND to_user = ? 
          AND is_read = 0
          AND deleted_by_receiver = 0`,
      [chatId, userId]
    );

    res.json({ messages: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error loading chat messages", err });
  }
};
