// controllers/messageController.js

const db = require('../config/db');

// Αποστολή μηνύματος
exports.sendMessage = (req, res) => {
  const from_user = req.user.id;
  const { to_user, subject, body } = req.body;

  if (!to_user || !body) {
    return res.status(400).json({ msg: 'Recipient and message body are required' });
  }

  const query = `
    INSERT INTO messages (from_user, to_user, subject, body)
    VALUES (?, ?, ?, ?)`;

  db.query(query, [from_user, to_user, subject || null, body], err => {
    if (err) return res.status(500).json({ msg: 'Error sending message', err });
    res.json({ msg: 'Message sent successfully' });
  });
};

// Εισερχόμενα μηνύματα
exports.getInbox = (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT m.*, u.username AS sender_username
    FROM messages m
    JOIN users u ON m.from_user = u.id
    WHERE m.to_user = ? AND m.deleted_by_receiver = FALSE
    ORDER BY m.sent_at DESC`;

  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ msg: 'Error loading inbox', err });
    res.json({ inbox: results });
  });
};

// Απεσταλμένα μηνύματα
exports.getSent = (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT m.*, u.username AS recipient_username
    FROM messages m
    JOIN users u ON m.to_user = u.id
    WHERE m.from_user = ? AND m.deleted_by_sender = FALSE
    ORDER BY m.sent_at DESC`;

  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ msg: 'Error loading sent messages', err });
    res.json({ sent: results });
  });
};

// Σήμανση ως αναγνωσμένο
exports.markAsRead = (req, res) => {
  const userId = req.user.id;
  const messageId = req.params.id;

  const query = `
    UPDATE messages
    SET is_read = TRUE
    WHERE id = ? AND to_user = ?`;

  db.query(query, [messageId, userId], err => {
    if (err) return res.status(500).json({ msg: 'Error updating message status', err });
    res.json({ msg: 'Message marked as read' });
  });
};
