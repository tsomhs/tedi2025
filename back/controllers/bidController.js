// controllers/bidController.js

const db = require("../config/db");

exports.placeBid = (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  const itemId = req.params.itemId;
  const { amount } = req.body;

  if (role !== "buyer") {
    return res.status(403).json({ msg: "Only buyers can place bids" });
  }

  // Get auction details
  const itemQuery = "SELECT * FROM items WHERE id = ?";
  db.query(itemQuery, [itemId], (err, results) => {
    if (err) return res.status(500).json({ msg: "DB error", err });
    if (results.length === 0)
      return res.status(404).json({ msg: "Bid controller: Auction not found" });

    const item = results[0];
    const now = new Date();
    const startTime = new Date(item.started);
    const endTime = new Date(item.ends);

    if (now < startTime || now >= endTime) {
      return res.status(400).json({ msg: "Auction is not active" });
    }

    // Get current highest bid
    const currentQuery =
      "SELECT MAX(amount) AS maxBid FROM bids WHERE item_id = ?";
    db.query(currentQuery, [itemId], (err, bidResult) => {
      if (err) return res.status(500).json({ msg: "Error checking bids", err });

      const current = bidResult[0].maxBid || item.first_bid;

      if (amount <= current) {
        return res
          .status(400)
          .json({ msg: `Your bid must be higher than ${current}` });
      }

      const insertQuery = `
    INSERT INTO bids (item_id, bidder_id, time, amount)
    VALUES (?, ?, NOW(), ?)
`;
      db.query(insertQuery, [itemId, userId, amount], (err) => {
        if (err) return res.status(500).json({ msg: "Error placing bid", err });

        const updateItemQuery = "UPDATE items SET currently = ? WHERE id = ?";
        db.query(updateItemQuery, [amount, itemId], (err) => {
          if (err)
            return res
              .status(500)
              .json({ msg: "Error updating current price", err });

          res.json({
            msg: "Bid placed successfully",
            amount,
          });
        });
      });
    });
  });
};

//Συνάρτηση getBidsForItem : Επιστρέφει όλες τις προσφορές για ένα item
exports.getBidsForItem = (req, res) => {
  const itemId = req.params.itemId;

  const query = `
    SELECT b.amount, b.time, u.username, u.buyer_rating AS rating, u.location, u.country 
    FROM bids b
    JOIN users u ON b.bidder_id = u.id
    WHERE b.item_id = ?
    ORDER BY b.amount DESC
  `;

  db.query(query, [itemId], (err, results) => {
    if (err) return res.status(500).json({ msg: "Error loading bids", err });

    res.json({ itemId, bids: results });
  });
};
