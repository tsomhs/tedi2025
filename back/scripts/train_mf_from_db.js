// Εκπαίδευση MF (SGD) απευθείας από MySQL: bids (+ προαιρετικά view_history).
// Αποθηκεύει: models/P.json, models/Q.json, models/mf_meta.json

const fs = require("fs");
const db = require("../config/db");

function randn(mean = 0, std = 0.1) {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return (
    mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  );
}
function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

async function fetchData() {
  const conn = db.promise();
  const [users] = await conn.query(`SELECT id FROM users`);
  const [items] = await conn.query(`SELECT id FROM items`);

  const [bids] = await conn.query(`
    SELECT bidder_id AS user_id, item_id, COUNT(*) AS cnt
    FROM bids GROUP BY bidder_id, item_id
  `);

  let views = [];
  try {
    const [v] = await conn.query(`
      SELECT user_id, item_id, COUNT(*) AS cnt
      FROM view_history GROUP BY user_id, item_id
    `);
    views = v;
  } catch (_) {
    /* ok αν δεν υπάρχει */
  }

  return { users, items, bids, views };
}

function buildInteractions(raw, wBids = 1.0, wViews = 0.3) {
  const { users, items, bids, views } = raw;
  const u2idx = new Map(users.map((u, i) => [String(u.id), i]));
  const i2idx = new Map(items.map((it, i) => [String(it.id), i]));
  const strengths = new Map(); // "u::i" -> score

  const add = (u, i, w) => {
    const k = `${u}::${i}`;
    strengths.set(k, (strengths.get(k) || 0) + w);
  };

  for (const r of bids) {
    const u = String(r.user_id),
      i = String(r.item_id);
    if (!u2idx.has(u) || !i2idx.has(i)) continue;
    add(u, i, wBids * Math.log(1 + Number(r.cnt || 1)));
  }
  for (const r of views) {
    const u = String(r.user_id),
      i = String(r.item_id);
    if (!u2idx.has(u) || !i2idx.has(i)) continue;
    add(u, i, wViews * Math.log(1 + Number(r.cnt || 1)));
  }

  const data = [];
  strengths.forEach((val, k) => {
    const [u, i] = k.split("::");
    data.push({ u: u2idx.get(u), i: i2idx.get(i), r: val });
  });
  return { data, users, items };
}

function trainMF(
  interactions,
  nUsers,
  nItems,
  { factors = 32, lr = 0.02, reg = 0.02, epochs = 30 }
) {
  const P = Array.from({ length: nUsers }, () =>
    Array.from({ length: factors }, () => randn(0, 0.1))
  );
  const Q = Array.from({ length: nItems }, () =>
    Array.from({ length: factors }, () => randn(0, 0.1))
  );

  for (let ep = 0; ep < epochs; ep++) {
    for (let k = interactions.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [interactions[k], interactions[j]] = [interactions[j], interactions[k]];
    }
    let se = 0,
      n = 0;
    for (const obs of interactions) {
      const pu = P[obs.u],
        qi = Q[obs.i];
      const pred = dot(pu, qi),
        err = obs.r - pred;
      se += err * err;
      n++;
      for (let f = 0; f < pu.length; f++) {
        const puf = pu[f],
          qif = qi[f];
        pu[f] += lr * (err * qif - reg * puf);
        qi[f] += lr * (err * puf - reg * qif);
      }
    }
    const rmse = Math.sqrt(se / Math.max(1, n));
    console.log(`epoch ${ep + 1}/${epochs} - rmse=${rmse.toFixed(4)}`);
  }
  return { P, Q };
}

async function main() {
  const factors = Number(process.argv[2] || 32);
  const epochs = Number(process.argv[3] || 30);
  const lr = Number(process.argv[4] || 0.02);
  const reg = Number(process.argv[5] || 0.02);

  console.log("[MF] Fetching DB…");
  const raw = await fetchData();
  const { data, users, items } = buildInteractions(raw);

  if (data.length === 0) {
    console.error(
      "No interactions found (bids/view_history). Run parseEbayData first."
    );
    process.exit(1);
  }
  console.log(
    `[MF] Users: ${users.length} | Items: ${items.length} | Interactions: ${data.length}`
  );

  const { P, Q } = trainMF(data, users.length, items.length, {
    factors,
    lr,
    reg,
    epochs,
  });

  if (!fs.existsSync("models")) fs.mkdirSync("models");
  fs.writeFileSync("models/P.json", JSON.stringify(P));
  fs.writeFileSync("models/Q.json", JSON.stringify(Q));
  fs.writeFileSync(
    "models/mf_meta.json",
    JSON.stringify(
      {
        factors,
        epochs,
        lr,
        reg,
        users: users.map((u) => String(u.id)),
        items: items.map((i) => String(i.id)),
      },
      null,
      2
    )
  );

  console.log("[MF] Saved: models/P.json, models/Q.json, models/mf_meta.json");
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
