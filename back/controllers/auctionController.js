// controllers/auctionController.js

const db = require("../config/db");

// Δημιουργία νέας δημοπρασίας
exports.createAuction = (req, res) => {
  const userId = req.user.id;
  const {
    itemName,
    categories,
    firstBid,
    buyPrice,
    location,
    country,
    started,
    ends,
    description,
  } = req.body;

  // Έλεγχος αν ο χρήστης είναι seller
  if (req.user.role !== "seller") {
    return res.status(403).json({ msg: "Only sellers can create auctions" });
  }

  // Δημιουργία αντικειμένου (item)
  const itemQuery = `
    INSERT INTO items (name, first_bid, buy_price, location, country, started, ends, seller_id, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(
    itemQuery,
    [
      itemName,
      firstBid,
      buyPrice || null,
      location,
      country,
      started,
      ends,
      userId,
      description,
    ],
    (err, result) => {
      if (err)
        return res.status(500).json({ msg: "DB error creating item", err });

      const itemId = result.insertId;

      // Κατηγορίες
      const insertCategory = (itemId, cat) => {
        return new Promise((resolve, reject) => {
          db.query(
            "INSERT INTO item_categories (item_id, category_name) VALUES (?, ?)",
            [itemId, cat],
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          );
        });
      };

      const catQueries = categories.map((cat) => insertCategory(itemId, cat));

      Promise.all(catQueries)
        .then(() => {
          res.json({ msg: "Auction created successfully", itemId });
        })
        .catch((err) => {
          res.status(500).json({ msg: "Error assigning categories", err });
        });
    }
  );
};

// Προβολή δημοπρασίας
exports.getAuctionById = (req, res) => {
  const auctionId = req.params.id;

  const query = `
    SELECT i.*, u.username AS seller_username
    FROM items i
    JOIN users u ON i.seller_id = u.id
    WHERE i.id = ?`;

  db.query(query, [auctionId], (err, results) => {
    if (err) return res.status(500).json({ msg: "DB error", err });
    if (results.length === 0)
      return res.status(404).json({ msg: "Auction not found" });

    const item = results[0];

    // Παίρνουμε και τις κατηγορίες
    db.query(
      "SELECT category_name FROM item_categories WHERE item_id = ?",
      [auctionId],
      (err, categories) => {
        if (err)
          return res.status(500).json({ msg: "Error loading categories", err });

        item.categories = categories.map((c) => c.category_name);
        res.json(item);
      }
    );
  });
};

// Ενημέρωση δημοπρασίας
exports.updateAuction = (req, res) => {
  const itemId = req.params.id;
  const userId = req.user.id;
  const { itemName, description, ends, buyPrice } = req.body;

  const checkQuery = "SELECT * FROM items WHERE id = ?";
  db.query(checkQuery, [itemId], (err, results) => {
    if (err) return res.status(500).json({ msg: "DB error", err });
    if (results.length === 0)
      return res.status(404).json({ msg: "Auction not found" });

    const item = results[0];

    if (item.seller_id !== userId && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    // Έλεγχος αν έχει ξεκινήσει ή υπάρχουν bids
    const now = new Date();
    const started = new Date(item.started);
    if (started <= now)
      return res.status(400).json({ msg: "Auction already started" });

    db.query(
      "SELECT COUNT(*) AS bidCount FROM bids WHERE item_id = ?",
      [itemId],
      (err, bidResults) => {
        if (err)
          return res.status(500).json({ msg: "Error checking bids", err });
        if (bidResults[0].bidCount > 0) {
          return res
            .status(400)
            .json({ msg: "Cannot update. Auction already has bids." });
        }

        const updateQuery = `
          UPDATE items SET name = ?, description = ?, ends = ?, buy_price = ? WHERE id = ?`;
        db.query(
          updateQuery,
          [itemName, description, ends, buyPrice, itemId],
          (err) => {
            if (err) return res.status(500).json({ msg: "Update failed", err });
            res.json({ msg: "Auction updated" });
          }
        );
      }
    );
  });
};

// Διαγραφή δημοπρασίας
exports.deleteAuction = (req, res) => {
  const itemId = req.params.id;
  const userId = req.user.id;

  db.query("SELECT * FROM items WHERE id = ?", [itemId], (err, results) => {
    if (err) return res.status(500).json({ msg: "DB error", err });
    if (results.length === 0)
      return res.status(404).json({ msg: "Auction not found" });

    const item = results[0];
    if (item.seller_id !== userId && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    const now = new Date();
    const started = new Date(item.started);
    if (started <= now)
      return res.status(400).json({ msg: "Auction already started" });

    db.query(
      "SELECT COUNT(*) AS bidCount FROM bids WHERE item_id = ?",
      [itemId],
      (err, bidResults) => {
        if (err)
          return res.status(500).json({ msg: "Error checking bids", err });
        if (bidResults[0].bidCount > 0) {
          return res
            .status(400)
            .json({ msg: "Cannot delete. Auction already has bids." });
        }

        // Διαγραφή
        db.query("DELETE FROM items WHERE id = ?", [itemId], (err) => {
          if (err) return res.status(500).json({ msg: "Delete failed", err });
          res.json({ msg: "Auction deleted" });
        });
      }
    );
  });
};

// Αναζήτηση/φιλτράρισμα δημοπρασιών
exports.searchAuctions = (req, res) => {
  const {
    category,
    q,
    minPrice,
    maxPrice,
    location,
    page = 1,
    limit = 10,
  } = req.query;

  let baseQuery = `
    SELECT i.*, u.username AS seller_username
    FROM items i
    JOIN users u ON i.seller_id = u.id
    LEFT JOIN item_categories c ON i.id = c.item_id
    WHERE NOW() BETWEEN i.started AND i.ends`;

  const values = [];

  if (category) {
    baseQuery += " AND c.category_name = ?";
    values.push(category);
  }

  if (q) {
    baseQuery += " AND (i.name LIKE ? OR i.description LIKE ?)";
    values.push(`%${q}%`, `%${q}%`);
  }

  if (minPrice) {
    baseQuery += " AND i.first_bid >= ?";
    values.push(minPrice);
  }

  if (maxPrice) {
    baseQuery +=
      " AND (SELECT MAX(b.amount) FROM bids b WHERE b.item_id = i.id) <= ?";
    values.push(maxPrice);
  }

  if (location) {
    baseQuery += " AND i.location LIKE ?";
    values.push(`%${location}%`);
  }

  const offset = (page - 1) * limit;
  baseQuery += " GROUP BY i.id ORDER BY i.started DESC LIMIT ?, ?";
  values.push(Number(offset), Number(limit));

  db.query(baseQuery, values, (err, results) => {
    if (err) return res.status(500).json({ msg: "Error during search", err });
    res.json({ results, page: Number(page), limit: Number(limit) });
  });
};

// Προβολή όλων των ενεργών δημοπρασιών
exports.getActiveAuctions = (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const query = `
    SELECT i.*, u.username AS seller_username
    FROM items i
    JOIN users u ON i.seller_id = u.id
    WHERE NOW() BETWEEN i.started AND i.ends
    ORDER BY i.ends ASC
    LIMIT ?, ?`;

  db.query(query, [offset, limit], (err, results) => {
    if (err) return res.status(500).json({ msg: "DB error", err });

    res.json({ auctions: results, page, limit });
  });
};
