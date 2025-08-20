const db = require("../config/db");

// Καταγραφή επίσκεψης
exports.logView = (req, res) => {
  const userId = req.user.id;
  const itemId = req.params.itemId;

  const insertQuery = `
    INSERT INTO view_history (id, item_id)
    VALUES (?, ?)
  `;

  db.query(insertQuery, [userId, itemId], (err) => {
    if (err) return res.status(500).json({ msg: "Error logging view", err });
    res.json({ msg: "View logged successfully" });
  });
};

// Προτάσεις βάσει ιστορικού
exports.getRecommendations = (req, res) => {
  const userId = req.user.id;

  // Παίρνουμε τις κατηγορίες των items που έχει δει ο χρήστης
  const categoryQuery = `
    SELECT DISTINCT ic.category_name
    FROM view_history vh
    JOIN items i ON vh.item_id = i.id
    JOIN item_categories ic ON i.id = ic.item_id
    WHERE vh.id = ?
  `;

  db.query(categoryQuery, [userId], (err, catResults) => {
    if (err)
      return res.status(500).json({ msg: "Error fetching categories", err });

    if (catResults.length === 0) return res.json({ recommendations: [] });

    const categories = catResults.map((row) => row.category_name);

    // Φέρνουμε άλλα items στις ίδιες κατηγορίες (εκτός αυτών που έχει ήδη δει)
    const recQuery = `
      SELECT DISTINCT i.*
      FROM items i
      JOIN item_categories ic ON i.id = ic.item_id
      WHERE ic.category_name IN (?) 
        AND i.id NOT IN (
          SELECT item_id FROM view_history WHERE id = ?
        )
      LIMIT 10
    `;

    db.query(recQuery, [categories, userId], (err, recResults) => {
      if (err)
        return res
          .status(500)
          .json({ msg: "Error fetching recommendations", err });
      res.json({ recommendations: recResults });
    });
  });
};
