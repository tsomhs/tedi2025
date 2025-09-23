// controllers/recommendationController.js
//
// Matrix Factorization (implicit) με SGD.
// Χρησιμοποιεί bids (βάρος 1.0) + view_history (βάρος 0.3).
// Cold-start: δημοφιλή με βάση bids + view_history.
//
// Απαιτεί tables: users, items, bids, view_history.
// Συμβατό με ρόλους: 'admin' / 'seller' / 'bidder' / 'visitor'.

const db = require('../config/db');

//helpers
function randn(mean = 0, std = 0.1) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}
function dot(a, b) { let s = 0; for (let i = 0; i < a.length; i++) s += a[i]*b[i]; return s; }

//DB fetch
function fetchData() {
  return new Promise((resolve, reject) => {
    const qUsers = `SELECT id FROM users`;
    const qItems = `SELECT id, started, ends FROM items`;

    db.query(qUsers, (errU, users) => {
      if (errU) return reject(errU);
      db.query(qItems, (errI, items) => {
        if (errI) return reject(errI);

        const qBids = `
          SELECT bidder_id AS user_id, item_id, COUNT(*) AS cnt
          FROM bids
          GROUP BY bidder_id, item_id
        `;
        const qViews = `
          SELECT user_id, item_id, COUNT(*) AS cnt
          FROM view_history
          GROUP BY user_id, item_id
        `;

        db.query(qBids, (errB, bids) => {
          if (errB) return reject(errB);
          db.query(qViews, (errV, views) => {
            if (errV) return reject(errV);
            resolve({ users, items, bids: bids || [], views: views || [] });
          });
        });
      });
    });
  });
}

function buildInteractions(raw, weightBids = 1.0, weightViews = 0.3) {
  const { users, items, bids, views } = raw;
  const u2idx = new Map(), i2idx = new Map();
  users.forEach((u, idx) => u2idx.set(u.id, idx));
  items.forEach((it, idx) => i2idx.set(it.id, idx));

  const key = (u,i) => `${u}::${i}`;
  const strengths = new Map();

  bids.forEach(r => {
    if (!u2idx.has(r.user_id) || !i2idx.has(r.item_id)) return;
    const s = weightBids * Math.log(1 + Number(r.cnt || 1));
    const k = key(r.user_id, r.item_id);
    strengths.set(k, (strengths.get(k) || 0) + s);
  });

  views.forEach(r => {
    if (!u2idx.has(r.user_id) || !i2idx.has(r.item_id)) return;
    const s = weightViews * Math.log(1 + Number(r.cnt || 1));
    const k = key(r.user_id, r.item_id);
    strengths.set(k, (strengths.get(k) || 0) + s);
  });

  const interactions = [];
  strengths.forEach((val, k) => {
    const [uId, iId] = k.split('::').map(Number);
    interactions.push({ uId, iId, u: u2idx.get(uId), i: i2idx.get(iId), r: val });
  });

  return { users, items, u2idx, i2idx, interactions };
}

//MF(SGD)
function trainMF(interactions, nUsers, nItems, { factors = 20, lr = 0.02, reg = 0.02, epochs = 30 } = {}) {
  const P = Array.from({ length: nUsers }, () => Array.from({ length: factors }, () => randn(0, 0.1)));
  const Q = Array.from({ length: nItems }, () => Array.from({ length: factors }, () => randn(0, 0.1)));

  for (let ep = 0; ep < epochs; ep++) {
    // Fisher-Yates shuffle
    for (let k = interactions.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [interactions[k], interactions[j]] = [interactions[j], interactions[k]];
    }
    for (const obs of interactions) {
      const pu = P[obs.u], qi = Q[obs.i];
      const pred = dot(pu, qi), err = obs.r - pred;
      for (let f = 0; f < pu.length; f++) {
        const puf = pu[f], qif = qi[f];
        pu[f] += lr * (err * qif - reg * puf);
        qi[f] += lr * (err * puf - reg * qif);
      }
    }
  }
  return { P, Q };
}

function recommendForUser(userId, state, topN = 5) {
  const { users, items, u2idx, i2idx, interactions, P, Q } = state;
  if (!u2idx.has(userId)) return [];
  const u = u2idx.get(userId), pu = P[u];

  //items που είδε/πείραξε ο χρήστης
  const seen = new Set(interactions.filter(x => x.uId === userId).map(x => x.iId));

    //μόνο ενεργα items
  const now = new Date();
  const active = items.filter(it => new Date(it.started) <= now && now < new Date(it.ends));

  const scored = [];
  for (const it of active) {
    if (seen.has(it.id)) continue;
    const i = i2idx.get(it.id);
    if (i === undefined) continue;
    scored.push([it.id, dot(pu, Q[i])]);
  }
  scored.sort((a, b) => b[1] - a[1]);
  return scored.slice(0, topN).map(x => x[0]);
}

function fetchItemsByIds(ids) {
  return new Promise((resolve, reject) => {
    if (!ids.length) return resolve([]);
    const placeholders = ids.map(() => '?').join(',');
    const q = `
      SELECT i.*, u.username AS seller_username
      FROM items i
      JOIN users u ON i.seller_id = u.id
      WHERE i.id IN (${placeholders})
    `;
    db.query(q, ids, (err, rows) => {
      if (err) return reject(err);
      const order = new Map(ids.map((id, idx) => [id, idx]));
      rows.sort((a, b) => order.get(a.id) - order.get(b.id));
      resolve(rows);
    });
  });
}

function fetchPopular(limit = 5) {
  return new Promise((resolve, reject) => {
    const q = `
      SELECT i.*, u.username AS seller_username,
             COALESCE(b.cnt, 0) AS bid_cnt,
             COALESCE(v.cnt, 0) AS view_cnt,
             (COALESCE(b.cnt,0) + 0.3*COALESCE(v.cnt,0)) AS popularity
      FROM items i
      JOIN users u ON i.seller_id = u.id
      LEFT JOIN ( SELECT item_id, COUNT(*) AS cnt FROM bids GROUP BY item_id ) b ON b.item_id = i.id
      LEFT JOIN ( SELECT item_id, COUNT(*) AS cnt FROM view_history GROUP BY item_id ) v ON v.item_id = i.id
      WHERE NOW() BETWEEN i.started AND i.ends
      ORDER BY popularity DESC
      LIMIT ?
    `;
    db.query(q, [limit], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

//public endpoints
exports.getTopRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 5));

    const raw = await fetchData();
    const { users, items, u2idx, i2idx, interactions } = buildInteractions(raw);

    const hasUser = u2idx.has(userId);
    const userInterCnt = interactions.filter(x => x.uId === userId).length;

    if (!hasUser || userInterCnt === 0) {
      const popular = await fetchPopular(limit);
      return res.json({ mode: 'cold-start', items: popular });
    }

    const { P, Q } = trainMF(interactions, users.length, items.length, {
      factors: 20, lr: 0.02, reg: 0.02, epochs: 30
    });

    const topIds = recommendForUser(userId, { users, items, u2idx, i2idx, interactions, P, Q }, limit);

    if (topIds.length === 0) {
      const popular = await fetchPopular(limit);
      return res.json({ mode: 'fallback-popular', items: popular });
    }

    const recItems = await fetchItemsByIds(topIds);
    res.json({ mode: 'personalized', items: recItems });
  } catch (err) {
    console.error('Recommendation error:', err);
    res.status(500).json({ msg: 'Server error generating recommendations', err });
  }
};

//καταγραφη επίσκεψης για implicit feedback
exports.logVisit = (req, res) => {
  const userId = req.user.id;
  const itemId = Number(req.params.itemId);
  if (!itemId) return res.status(400).json({ msg: 'Invalid itemId' });

  const q = `INSERT INTO view_history (user_id, item_id, viewed_at) VALUES (?, ?, NOW())`;
  db.query(q, [userId, itemId], (err) => {
    if (err) return res.status(500).json({ msg: 'DB error logging visit', err });
    res.json({ msg: 'Visit logged', userId, itemId });
  });
};
