// controllers/auctionController.js

const db = require("../config/db");

const safeFloat = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
};

const formatDateForMySQL = (dt) => {
  if (!dt) return null;
  if (dt instanceof Date) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(
      dt.getDate()
    )} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
  }

  let clean = dt.replace("T", " ").replace(/:{2,}$/, "");
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(clean)) clean += ":00";
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(clean)) return null;
  return clean;
};

// --- Create Auction ---
exports.createAuction = (req, res) => {
  const { id: userId, role } = req.user || {};
  if (role !== "seller")
    return res.status(403).json({ msg: "Only sellers can create auctions" });

  const {
    itemName,
    categories = [],
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

  if (!itemName || !firstBid || !started || !ends)
    return res.status(400).json({ msg: "Missing required fields" });

  const startedFormatted = formatDateForMySQL(started);
  const endsFormatted = formatDateForMySQL(ends);

  const itemQuery = `
    INSERT INTO items
      (name, first_bid, currently, buy_price, latitude, longitude, country, location, started, ends, status, seller_id, description, sold, winner_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, NULL)
  `;

  db.query(
    itemQuery,
    [
      itemName,
      safeFloat(firstBid),
      safeFloat(firstBid),
      safeFloat(buyPrice),
      safeFloat(latitude),
      safeFloat(longitude),
      country || null,
      location || null,
      startedFormatted,
      endsFormatted,
      0,
      userId,
      description,
    ],
    (err, result) => {
      if (err)
        return res.status(500).json({ msg: "DB error creating item", err });
      const itemId = result.insertId;

      if (!categories.length)
        return res.json({
          success: true,
          msg: "Auction created",
          data: { id: itemId },
        });

      // Insert categories
      const catValues = categories.map((c) => [itemId, c]);
      db.query(
        "INSERT INTO item_categories (item_id, category_name) VALUES ?",
        [catValues],
        (catErr) => {
          if (catErr)
            return res
              .status(500)
              .json({ msg: "Error assigning categories", err: catErr });
          res.json({
            success: true,
            msg: "Auction created",
            data: { id: itemId, categories },
          });
        }
      );
    }
  );
};

// --- Update Auction ---
exports.updateAuction = (req, res) => {
  const { id: userId, role } = req.user || {};
  if (role !== "seller")
    return res.status(403).json({ msg: "Only sellers can update auctions" });

  const {
    auctionId,
    itemName,
    categories = [],
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

  if (!auctionId || !itemName || !firstBid || !started || !ends)
    return res.status(400).json({ msg: "Missing required fields" });

  const startedFormatted = formatDateForMySQL(started);
  const endsFormatted = formatDateForMySQL(ends);

  const updateQuery = `
    UPDATE items SET
      name = ?, description = ?, started = ?, ends = ?,
      buy_price = ?, first_bid = ?, currently = ?, latitude = ?, longitude = ?, country = ?, location = ?
    WHERE id = ? AND seller_id = ?
  `;

  db.query(
    updateQuery,
    [
      itemName,
      description,
      startedFormatted,
      endsFormatted,
      safeFloat(buyPrice),
      safeFloat(firstBid),
      safeFloat(firstBid),
      safeFloat(latitude),
      safeFloat(longitude),
      country || null,
      location || null,
      auctionId,
      userId,
    ],
    (err) => {
      if (err)
        return res.status(500).json({ msg: "DB error updating item", err });

      // Update categories
      db.query(
        "DELETE FROM item_categories WHERE item_id = ?",
        [auctionId],
        (delErr) => {
          if (delErr)
            return res
              .status(500)
              .json({ msg: "Error clearing old categories", err: delErr });
          if (!categories.length)
            return res.json({
              success: true,
              msg: "Auction updated",
              data: { id: auctionId },
            });

          const catValues = categories.map((c) => [auctionId, c]);
          db.query(
            "INSERT INTO item_categories (item_id, category_name) VALUES ?",
            [catValues],
            (catErr) => {
              if (catErr)
                return res
                  .status(500)
                  .json({ msg: "Error assigning categories", err: catErr });
              res.json({
                success: true,
                msg: "Auction updated",
                data: { id: auctionId, categories },
              });
            }
          );
        }
      );
    }
  );
};

// Προβολή δημοπρασίας
exports.getAuctionById = (req, res) => {
  const auctionId = req.params.id;

  const query = `
    SELECT i.*, u.id AS seller_id, u.username AS seller_username
    FROM items i
    LEFT JOIN users u ON i.seller_id = u.id
    WHERE i.id = ?
  `;

  db.query(query, [auctionId], (err, results) => {
    if (err) return res.status(500).json({ msg: "DB error", err });
    if (results.length === 0)
      return res.status(404).json({ msg: "Auction not found" });

    const item = results[0];

    db.query(
      "SELECT category_name FROM item_categories WHERE item_id = ?",
      [auctionId],
      (err, categories) => {
        if (err)
          return res.status(500).json({ msg: "Error loading categories", err });

        item.categories = categories.map((c) => c.category_name);

        // ends is already string (because of dateStrings:true), safe for compare
        const now = new Date();
        const endsDate = new Date(item.ends);
        item.sold = endsDate <= now;

        const sendResponse = () => {
          res.json({
            ...item,
            seller: { id: item.seller_id, username: item.seller_username },
            location: item.location,
            categories: item.categories,
            winner: item.winner || null,
          });
        };

        if (item.sold) {
          const bidQuery = `
            SELECT b.*, u.id AS bidder_id, u.username, u.buyer_rating AS rating
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
            sendResponse();
          });
        } else {
          item.winner = null;
          sendResponse();
        }
      }
    );
  });
};

exports.getActiveAuctions = async (req, res) => {
  try {
    const [results] = await db.promise().query(
      `SELECT i.*, u.username AS seller_username
       FROM items i
       JOIN users u ON i.seller_id = u.id
       WHERE NOW() BETWEEN i.started AND i.ends
       ORDER BY i.ends ASC`
    );
    res.json(results);
  } catch (err) {
    console.error("Error fetching active auctions:", err);
    res.status(500).json({ msg: "DB error", err });
  }
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
      return res.status(404).json({ msg: "Auction not found 2" });

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

// Προβολή όλων των δημοπρασιών (χωρίς σελιδοποίηση)
exports.getAllAuctions = async (req, res) => {
  try {
    const [results] = await db.promise().query(`
      SELECT i.*, 
             u.id AS seller_id,
             u.username AS seller_username,
             (SELECT COUNT(*) FROM bids b WHERE b.item_id = i.id) AS bid_count
      FROM items i
      LEFT JOIN users u ON i.seller_id = u.id
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
          seller: {
            id: item.seller_id,
            username: item.seller_username,
          },
          categories: cats.map((c) => c.category_name),
          location: item.location,
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
      return res.status(404).json({ msg: "Auction not found 3" });

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

exports.getUserAuctions = async (req, res) => {
  try {
    // req.user is set by verifyToken
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ msg: "User ID missing in token" });
    }

    // Fetch auctions for this user, including categories
    const [auctions] = await db.promise().query(
      `SELECT i.*, 
              u.username AS seller_username,
              (SELECT COUNT(*) FROM bids b WHERE b.item_id = i.id) AS bid_count,
              GROUP_CONCAT(ic.category_name) AS categories
       FROM items i
       JOIN users u ON i.seller_id = u.id
       LEFT JOIN item_categories ic ON i.id = ic.item_id
       WHERE i.seller_id = ?
       GROUP BY i.id`,
      [userId]
    );

    // Convert categories string into array
    const formattedAuctions = auctions.map((a) => ({
      ...a,
      categories: a.categories ? a.categories.split(",") : [],
    }));

    return res.json({
      success: true,
      auctions: formattedAuctions,
      total: formattedAuctions.length,
    });
  } catch (err) {
    console.error("Error in getUserAuctions:", err);
    return res.status(500).json({ msg: "Server error fetching your auctions" });
  }
};
