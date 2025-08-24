// controllers/auctionController.js

const db = require("../config/db");

// Δημιουργία νέας δημοπρασίας
exports.createAuction = (req, res) => {
  const userId = req.user?.id;
  const { role } = req.user || {};
  console.log("Decoded user in createAuction:", req.user);

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
  if (role !== "seller") {
    return res.status(403).json({ msg: "Only sellers can create auctions" });
  }

  if (!itemName || !firstBid || !started || !ends) {
    return res.status(400).json({ msg: "Missing required fields" });
  }

  // Convert ISO date strings to MySQL DATETIME format
  const startedFormatted = started.replace("T", " ") + ":00";
  const endsFormatted = ends.replace("T", " ") + ":00";
  const itemQuery = `
  INSERT INTO items
    (name, first_bid, currently, buy_price, location, country, started, ends, status, seller_id, description)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

  db.query(
    itemQuery,
    [
      itemName,
      parseFloat(firstBid),
      parseFloat(firstBid), // <-- set currently = first_bid
      buyPrice ? parseFloat(buyPrice) : null,
      location,
      country,
      startedFormatted,
      endsFormatted,
      0, // pending status
      userId,
      description,
    ],
    (err, result) => {
      if (err) {
        console.error("DB error creating item:", err);
        return res.status(500).json({ msg: "DB error creating item", err });
      }

      const itemId = result.insertId;

      // Handle categories
      const cats = Array.isArray(categories) ? categories : [];
      if (cats.length === 0) {
        return res.json({
          success: true,
          msg: "Auction created successfully",
          data: {
            id: itemId,
            name: itemName,
            firstBid: parseFloat(firstBid),
            buyPrice: buyPrice ? parseFloat(buyPrice) : null,
            location,
            country,
            started: startedFormatted,
            ends: endsFormatted,
            description,
            status: 0,
            seller: { userID: req.user.username, rating: 0 },
            categories: [],
            numberOfBids: 0,
            bids: [],
          },
        });
      }

      // Insert categories
      let remaining = cats.length;
      const insertedCategories = [];

      cats.forEach((cat) => {
        db.query(
          "INSERT INTO item_categories (item_id, category_name) VALUES (?, ?)",
          [itemId, cat],
          (e) => {
            if (e) {
              console.error("Error inserting category:", e);
              return res
                .status(500)
                .json({ msg: "Error assigning categories", err: e });
            }
            insertedCategories.push(cat);
            remaining -= 1;
            if (remaining === 0) {
              res.json({
                success: true,
                msg: "Auction created successfully",
                data: {
                  id: itemId,
                  name: itemName,
                  firstBid: parseFloat(firstBid),
                  buyPrice: buyPrice ? parseFloat(buyPrice) : null,
                  location,
                  country,
                  started: startedFormatted,
                  ends: endsFormatted,
                  description,
                  status: 0,
                  seller: { userID: req.user.username, rating: 0 },
                  categories: insertedCategories,
                  numberOfBids: 0,
                  bids: [],
                },
              });
            }
          }
        );
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

exports.updateAuction = (req, res) => {
  const itemId = req.params.id;
  const userId = req.user.id;

  const {
    itemName,
    description,
    started: newStart,
    ends,
    buyPrice,
    categories,
    location,
    country,
    firstBid,
  } = req.body;

  const checkQuery = "SELECT * FROM items WHERE id = ?";
  db.query(checkQuery, [itemId], (err, results) => {
    if (err) return res.status(500).json({ msg: "DB error", err });
    if (results.length === 0)
      return res.status(404).json({ msg: "Auction not found" });

    const item = results[0];
    if (item.seller_id !== userId && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    const now = new Date();
    if (new Date(item.started) <= now) {
      return res.status(400).json({ msg: "Auction already started" });
    }

    // Cannot update if bids exist
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

        const startedStr = newStart
          ? new Date(newStart).toISOString().slice(0, 19).replace("T", " ")
          : item.started;

        const endsStr = ends
          ? new Date(ends).toISOString().slice(0, 19).replace("T", " ")
          : item.ends;

        const updateQuery = `
          UPDATE items SET
            name = ?,
            description = ?,
            started = ?,
            ends = ?,
            buy_price = ?,
            first_bid = ?,
            location = ?,
            country = ?
          WHERE id = ?
        `;

        db.query(
          updateQuery,
          [
            itemName,
            description,
            startedStr,
            endsStr,
            buyPrice,
            firstBid,
            location,
            country,
            itemId,
          ],
          (err) => {
            if (err) return res.status(500).json({ msg: "Update failed", err });

            // Update categories if provided
            if (Array.isArray(categories)) {
              // First delete old categories
              db.query(
                "DELETE FROM item_categories WHERE item_id = ?",
                [itemId],
                (err) => {
                  if (err) console.error("Error deleting old categories", err);

                  // Insert new categories
                  if (categories.length === 0) {
                    return res.json({
                      success: true,
                      msg: "Auction updated successfully",
                    });
                  }

                  let remaining = categories.length;
                  categories.forEach((cat) => {
                    db.query(
                      "INSERT INTO item_categories (item_id, category_name) VALUES (?, ?)",
                      [itemId, cat],
                      (err) => {
                        if (err) console.error("Error inserting category", err);
                        remaining -= 1;
                        if (remaining === 0) {
                          res.json({
                            success: true,
                            msg: "Auction updated successfully",
                          });
                        }
                      }
                    );
                  });
                }
              );
            } else {
              // No categories update needed
              res.json({ success: true, msg: "Auction updated successfully" });
            }
          }
        );
      }
    );
  });
};

// Διαγραφή δημοπρασίας
exports.deleteAuction = (req, res) => {
  console.log("Delete request user:", req.user);
  console.log("Delete request params:", req.params);

  const auctionId = req.params.id;
  if (!auctionId) {
    return res.status(400).json({ msg: "Auction ID missing" });
  }

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

// Προβολή όλων των δημοπρασιών (χωρίς σελιδοποίηση)
exports.getAllAuctions = (req, res) => {
  const query = `
    SELECT i.*, u.username AS seller_username
    FROM items i
    JOIN users u ON i.seller_id = u.id
    ORDER BY i.started DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("DB error fetching auctions:", err);
      return res.status(500).json({ msg: "DB error", err });
    }

    const auctions = [];

    let remaining = results.length;
    if (remaining === 0) return res.json({ auctions: [], total: 0 });

    results.forEach((item) => {
      db.query(
        "SELECT category_name FROM item_categories WHERE item_id = ?",
        [item.id],
        (err, categories) => {
          if (err)
            return res
              .status(500)
              .json({ msg: "Error loading categories", err });

          item.categories = categories.map((c) => c.category_name);
          auctions.push(item);

          remaining -= 1;
          if (remaining === 0) {
            res.json({ auctions, total: auctions.length });
          }
        }
      );
    });
  });
};
