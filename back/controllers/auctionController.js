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
    latitude,
    longitude,
    country,
    location,
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
    (name, first_bid, currently, buy_price, latitude, longitude, country, location, started, ends, status, seller_id, description, sold, winner_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, NULL)
`;

  db.query(
    itemQuery,
    [
      itemName,
      parseFloat(firstBid),
      parseFloat(firstBid),
      buyPrice !== "" && !isNaN(parseFloat(buyPrice))
        ? parseFloat(buyPrice)
        : null,
      latitude !== "" && !isNaN(parseFloat(latitude))
        ? parseFloat(latitude)
        : null,
      longitude !== "" && !isNaN(parseFloat(longitude))
        ? parseFloat(longitude)
        : null,
      country || null,
      location || null,
      startedFormatted,
      endsFormatted,
      0,
      userId,
      description,
    ],
    (err, result) => {
      if (err) {
        console.error("Error inserting item:", err);
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
            latitude: latitude,
            longitude: longitude,
            country: country,
            location: location,
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
                  latitude: latitude !== "" ? parseFloat(latitude) : null,
                  longitude: longitude !== "" ? parseFloat(longitude) : null,
                  country: country || null,
                  location: location || null,
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

        // Έλεγχος αν η δημοπρασία έχει λήξει
        const now = new Date();
        const ends = new Date(item.ends);
        item.sold = ends <= now;

        if (item.sold) {
          // Παίρνουμε τον νικητή (αν υπάρχει)
          const bidQuery = `
            SELECT b.*, u.username, u.buyer_rating AS rating
            FROM bids b
            JOIN users u ON b.bidder_id = u.id
            WHERE b.item_id = ?
            ORDER BY b.amount DESC, b.time DESC
            LIMIT 1
          `;
          db.query(bidQuery, [auctionId], (err, bids) => {
            if (err)
              return res
                .status(500)
                .json({ msg: "Error fetching winner", err });

            item.winner = bids.length > 0 ? bids[0] : null;
            res.json({
              ...item,
              location: item.location, // already handled in create/update
              categories: categories.map((c) => c.category_name),
            });
          });
        } else {
          item.winner = null;
          res.json({
            ...item,
            location: item.location, // already handled in create/update
            categories: categories.map((c) => c.category_name),
          });
        }
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
    latitude,
    longitude,
    country,
    location,
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
            latitude = ?,
            longitude = ?,
            country = ?,
            location = ?
          WHERE id = ?
        `;

        db.query(
          updateQuery,
          [
            itemName,
            description,
            startedStr,
            endsStr,
            buyPrice ? parseFloat(buyPrice) : null,
            firstBid ? parseFloat(firstBid) : null,
            latitude !== "" ? parseFloat(latitude) : null,
            longitude !== "" ? parseFloat(longitude) : null,
            country || null,
            location || null,
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
    latitude,
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

  if (latitude) {
    baseQuery += " AND i.latitude LIKE ?";
    values.push(`%${latitude}%`);
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
exports.getAllAuctions = async (req, res) => {
  try {
    const [results] = await db.promise().query(`
      SELECT i.*, 
             u.username AS seller_username,
             (SELECT COUNT(*) FROM bids b WHERE b.item_id = i.id) AS bid_count
      FROM items i
      JOIN users u ON i.seller_id = u.id
      ORDER BY i.started DESC
    `);

    // Fetch categories for all auctions
    const auctions = await Promise.all(
      results.map(async (item) => {
        const [cats] = await db
          .promise()
          .query(
            "SELECT category_name FROM item_categories WHERE item_id = ?",
            [item.id]
          );

        return {
          ...item,
          categories: cats.map((c) => c.category_name),
          location: item.location, // include location
        };
      })
    );

    res.json({ auctions, total: auctions.length });
  } catch (err) {
    console.error("DB error fetching auctions:", err);
    res.status(500).json({ msg: "DB error", err });
  }
};

exports.buyNow = (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  const auctionId = req.params.id;

  if (role !== "buyer") {
    return res.status(403).json({ msg: "Only buyers can use Buy Now" });
  }

  // Get auction details
  const query = "SELECT * FROM items WHERE id = ?";
  db.query(query, [auctionId], (err, results) => {
    if (err) return res.status(500).json({ msg: "DB error", err });
    if (results.length === 0)
      return res.status(404).json({ msg: "Auction not found" });

    const auction = results[0];

    // Place bid equal to buy_price
    const bidQuery = `
      INSERT INTO bids (item_id, bidder_id, time, amount)
      VALUES (?, ?, NOW(), ?)
    `;
    db.query(bidQuery, [auctionId, userId, auction.buy_price], (err) => {
      if (err)
        return res.status(500).json({ msg: "Error placing buy bid", err });

      // Update auction: set current price and end immediately
      const updateQuery = `
  UPDATE items
  SET currently = ?, ends = NOW(), sold = TRUE, winner_id = ?
  WHERE id = ?
`;
      db.query(updateQuery, [auction.buy_price, userId, auctionId], (err) => {
        if (err)
          return res.status(500).json({ msg: "Error finalizing auction", err });
        res.json({
          msg: "Item purchased successfully with Buy Now",
          buyPrice: auction.buy_price,
        });
      });
    });
  });
};

exports.getWonAuctions = async (req, res) => {
  try {
    const userId = req.user?.id; // <-- matches the JWT payload
    if (!userId)
      return res.status(400).json({ message: "No user id in token" });

    const [rows] = await db.promise().query(
      `SELECT i.*, u.username AS seller_name, b.bidder_id AS winner_id, b.amount AS final_price
         FROM items i
         JOIN bids b ON b.id = (
             SELECT id FROM bids WHERE item_id = i.id ORDER BY amount DESC, time DESC LIMIT 1
         )
         JOIN users u ON i.seller_id = u.id
         WHERE i.ends < NOW() AND b.bidder_id = ?`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Error fetching won auctions:", err);
    res
      .status(500)
      .json({ message: "Error fetching won auctions", error: err.message });
  }
};
