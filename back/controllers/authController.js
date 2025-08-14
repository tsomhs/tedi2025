const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// REGISTER
exports.register = (req, res) => {
  const {
    username, password, email,
    first_name, last_name, phone_number, country, address, vat_number,
    role
  } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ msg: "Fill all required fields (username, password, email)" });
  }

  const allowedRoles = ['buyer','seller'];
  const finalRole = allowedRoles.includes(role) ? role : 'buyer';

  db.query("SELECT id FROM users WHERE username = ?", [username], (err, rows) => {
    if (err) return res.status(500).json({ msg: 'DB error', err });
    if (rows.length > 0) {
      return res.status(420).json({ msg: "Username already exists" });
    }

    const hashed = bcrypt.hashSync(password, 10);

    const sql = `INSERT INTO users
      (username, password, email, role, approved, first_name, last_name, phone_number, country, address, vat_number)
      VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`;

    const params = [
      username, hashed, email, finalRole,
      first_name || null,
      last_name || null,
      phone_number || null,
      country || null,
      address || null,
      vat_number || null
    ];

    db.query(sql, params, (err2) => {
      if (err2) return res.status(500).json({ msg: 'DB insert error', err: err2 });
      res.json({ msg: "Registration success. Wait for admin approval." });
    });
  });
};

// LOGIN
exports.login = (req, res) => {
  const { username, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    (err, results) => {
      if (err) throw err;

      if (results.length === 0) {
        return res.status(400).json({ msg: "User not found" });
      }

      const user = results[0];

      if (!bcrypt.compareSync(password, user.password)) {
        return res.status(400).json({ msg: "Invalid password" });
      }

      if (!user.approved) {
        return res.status(403).json({ msg: "User not approved by admin." });
      }

      const token = jwt.sign({ id: user.id, role: user.role }, "SECRET_KEY");

      res.json({ token });
    }
  );
};
