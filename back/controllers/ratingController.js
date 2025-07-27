const db = require('../config/db');

// Υποβολή αξιολόγησης
exports.submitRating = (req, res) => {
  const fromUser = req.user.id;
  const { item_id, to_user, rating_value, comment, role } = req.body;

  // Βασικός έλεγχος πεδίων
  if (!item_id || !to_user || !rating_value || !role) {
    return res.status(400).json({ msg: 'Missing required fields' });
  }

  // Έλεγχος συμμετοχής: Πρέπει είτε να είσαι seller είτε ο winning bidder
  const participationQuery = `
    SELECT i.seller_id, b.bidder_id
    FROM items i
    LEFT JOIN (
      SELECT bidder_id, item_id
      FROM bids
      WHERE item_id = ?
      ORDER BY amount DESC
      LIMIT 1
    ) b ON i.id = b.item_id
    WHERE i.id = ?
  `;

  db.query(participationQuery, [item_id, item_id], (err, results) => {
    if (err) return res.status(500).json({ msg: 'DB error', err });
    if (results.length === 0) return res.status(404).json({ msg: 'Auction not found' });

    const { seller_id, bidder_id } = results[0];

    const allowed =
      (fromUser === seller_id && to_user === bidder_id && role === 'bidder') ||
      (fromUser === bidder_id && to_user === seller_id && role === 'seller');

    if (!allowed) {
      return res.status(403).json({ msg: 'You are not allowed to rate this user for this auction' });
    }

    // Εισαγωγή αξιολόγησης
    const insertQuery = `
      INSERT INTO ratings (item_id, from_user, to_user, rating_value, comment, role)
      VALUES (?, ?, ?, ?, ?, ?)`;

    db.query(insertQuery, [item_id, fromUser, to_user, rating_value, comment || null, role], err => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ msg: 'You have already rated this user for this auction' });
        }
        return res.status(500).json({ msg: 'Error submitting rating', err });
      }

      res.json({ msg: 'Rating submitted successfully' });
    });
  });
};

// Προβολή αξιολογήσεων που έλαβε χρήστης
exports.getRatingsForUser = (req, res) => {
  const userId = req.params.userId;

  const query = `
    SELECT r.*, u.username AS from_username
    FROM ratings r
    JOIN users u ON r.from_user = u.id
    WHERE r.to_user = ?
    ORDER BY r.created_at DESC`;

  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ msg: 'Error loading ratings', err });

    res.json({ ratings: results });
  });
};
