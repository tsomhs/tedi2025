// controllers/exportController.js

const db = require('../config/db');
const mysql = require('mysql2/promise'); // για async/await
const xmlbuilder = require('xmlbuilder');

// Δημιουργεί promise-based σύνδεση
const getConnection = async () => {
  return await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '2001',
    database: 'auction_db'
  });
};

// Εξαγωγή σε JSON
exports.exportToJSON = (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Only admin can export data' });
  }

  const query = `
    SELECT i.*, u.username AS seller_username,
           (SELECT GROUP_CONCAT(c.category_name) 
            FROM item_categories c WHERE c.item_id = i.id) AS categories
    FROM items i
    JOIN users u ON i.seller_id = u.id`;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ msg: 'DB error', err });
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(results, null, 2));
  });
};

// Εξαγωγή σε XML
exports.exportToXML = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Only admin can export data' });
  }

  try {
    const conn = await getConnection();

    const [items] = await conn.query(`
      SELECT i.*, u.username AS seller_username, u.rating AS seller_rating,
             (SELECT GROUP_CONCAT(c.category_name) 
              FROM item_categories c WHERE c.item_id = i.id) AS categories,
             (SELECT COUNT(*) FROM bids b WHERE b.item_id = i.id) AS bid_count
      FROM items i
      JOIN users u ON i.seller_id = u.id
    `);

    const root = xmlbuilder.create('Items');

    for (const item of items) {
      const itemNode = root.ele('Item', { ItemID: item.id });
      itemNode.ele('Name', item.name);

      const categories = (item.categories || '').split(',');
      categories.forEach(cat => {
        if (cat.trim()) itemNode.ele('Category', cat.trim());
      });

      // Bids για κάθε item
      let currently = item.first_bid;
      const [bids] = await conn.query(`
        SELECT b.*, u.username, u.rating, u.location, u.country
        FROM bids b
        JOIN users u ON b.bidder_id = u.id
        WHERE b.item_id = ?
        ORDER BY b.time ASC
      `, [item.id]);

      if (bids.length > 0) {
        currently = bids[bids.length - 1].amount;
      }

      itemNode.ele('Currently', `$${Number(currently).toFixed(2)}`);
      if (item.buy_price) itemNode.ele('Buy_Price', `$${Number(item.buy_price).toFixed(2)}`);
      itemNode.ele('First_Bid', `$${Number(item.first_bid).toFixed(2)}`);
      itemNode.ele('Number_of_Bids', item.bid_count);

      const bidsNode = itemNode.ele('Bids');
      bids.forEach(bid => {
        const bidNode = bidsNode.ele('Bid');
        const bidder = bidNode.ele('Bidder', {
          UserID: bid.username,
          Rating: bid.rating || 0
        });

        bidder.ele('Location', bid.location || 'N/A');
        bidder.ele('Country', bid.country || 'N/A');
        bidNode.ele('Time', formatDate(bid.time));
        bidNode.ele('Amount', `$${Number(bid.amount).toFixed(2)}`);
      });

      itemNode.ele('Location', item.location);
      itemNode.ele('Country', item.country);
      itemNode.ele('Started', formatDate(item.started));
      itemNode.ele('Ends', formatDate(item.ends));
      itemNode.ele('Seller', {
        UserID: item.seller_username,
        Rating: item.seller_rating
      });
      itemNode.ele('Description', item.description);
    }

    await conn.end();

    res.setHeader('Content-Type', 'application/xml');
    res.send(root.end({ pretty: true }));

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error', err });
  }
};

// Helper για format ημερομηνιών
function formatDate(date) {
  const d = new Date(date);
  return d.toISOString().replace('T', ' ').split('.')[0];
}
