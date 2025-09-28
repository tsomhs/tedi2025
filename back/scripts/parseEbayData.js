// Διαβάζει τα items-*.xml του ebay-data και γεμίζει MySQL: users, items, item_categories, bids
// Χρήση: node scripts/parseEbayData.js data/ebay-data

const db = require("../config/db");
const fs = require("fs");
const path = require("path");
const xml2js = require("xml2js");

const DATA_DIR = process.argv[2] || "./ebay-data";
const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });

function moneyToNum(s) {
  return Number(String(s || "0").replace(/[$,]/g, ""));
}
function ts(s) {
  return new Date(s);
}

async function main() {
  const conn = db.promise();
  console.log("MySQL connected!");

  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => /^items-\d+\.xml$/i.test(f))
    .map((f) => path.join(DATA_DIR, f));

  // === helpers (UPSERTs) ===
  async function upsertUser(username, role) {
    if (!username) return null;
    // Χαρτογράφηση ρόλων στο enum του schema
    const safeRole = role === "seller" ? "seller" : "buyer"; // οι bidders -> buyer

    const email = `${username}@ebay.local`; // UNIQUE & NOT NULL
    const password = "imported"; // απλό placeholder

    await conn.execute(
      `INSERT INTO users (username, email, password, role, approved)
       VALUES (?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE role=VALUES(role), approved=1`,
      [username, email, password, safeRole]
    );

    const [rows] = await conn.execute(`SELECT id FROM users WHERE username=?`, [
      username,
    ]);
    return rows[0]?.id || null;
  }

  async function insertItem(it) {
    const [res] = await conn.execute(
      `INSERT INTO items (
         name, first_bid, currently, buy_price,
         latitude, longitude, location, country,
         started, ends, seller_id, description
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        it.name,
        it.first_bid,
        it.currently,
        it.buy_price,
        it.latitude,
        it.longitude,
        it.location,
        it.country,
        it.started,
        it.ends,
        it.seller_id,
        it.description,
      ]
    );
    return res.insertId;
  }

  async function addCategory(itemId, cat) {
    if (!cat) return;
    await conn.execute(
      `INSERT INTO item_categories (item_id, category_name) VALUES (?, ?)`,
      [itemId, String(cat)]
    );
  }

  async function addBid(itemId, bidderId, time, amount) {
    if (!itemId || !bidderId || !(amount > 0)) return;
    await conn.execute(
      `INSERT INTO bids (item_id, bidder_id, time, amount) VALUES (?, ?, ?, ?)`,
      [itemId, bidderId, time, amount]
    );
  }

  for (const file of files) {
    console.log("Parsing:", file);
    const xml = fs.readFileSync(file, "utf8");
    const json = await parser.parseStringPromise(xml);

    let items = json.Items?.Item || [];
    if (!Array.isArray(items)) items = [items];

    for (const I of items) {
      // ---- seller ----
      const sellerUsername = I.Seller?.UserID || null;
      const sellerId = await upsertUser(sellerUsername, "seller");

      // ---- item fields ----
      const name = I.Name ?? "";
      const description = I.Description ?? "";
      const location = I.Location ?? null;
      const country = I.Country ?? null;
      const latitude = I.Location?.Latitude
        ? Number(I.Location.Latitude)
        : null;
      const longitude = I.Location?.Longitude
        ? Number(I.Location.Longitude)
        : null;

      const started = ts(I.Started);
      const ends = ts(I.Ends);

      const first_bid = moneyToNum(I.First_Bid);
      const currently = moneyToNum(I.Currently ?? I.First_Bid); // NOT NULL στο schema
      const buy_price = I.Buy_Price ? moneyToNum(I.Buy_Price) : null;

      const itemId = await insertItem({
        name,
        first_bid,
        currently,
        buy_price,
        latitude,
        longitude,
        location,
        country,
        started,
        ends,
        seller_id: sellerId,
        description,
      });

      // ---- categories ----
      const cats = I.Category
        ? Array.isArray(I.Category)
          ? I.Category
          : [I.Category]
        : [];
      for (const c of cats) await addCategory(itemId, c);

      // ---- bids ----
      const B = I.Bids?.Bid || [];
      const bids = Array.isArray(B) ? B : B ? [B] : [];
      for (const b of bids) {
        const bidderUsername = b.Bidder?.UserID || null;
        const bidderId = await upsertUser(bidderUsername, "buyer"); // ΟΧΙ 'bidder'
        const time = ts(b.Time);
        const amount = moneyToNum(b.Amount);
        await addBid(itemId, bidderId, time, amount);
      }
    }
  }

  console.log("Import finished.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
