const db = require("../config/db");

// GET /api/admin/users?approved
exports.listUsers = (req, res) => {
  const sql = `SELECT id, username, email, role, approved, first_name, last_name,
                      phone_number, country, address, vat_number
               FROM users ORDER BY id DESC`;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ msg: "DB error", err });
    res.json(rows);
  });
};

// PUT /api/admin/users/:id/approve  body: { approved: 0|1 }
exports.setUserApproval = (req, res) => {
  const id = req.params.id;
  const { approved } = req.body;
  if (approved !== 0 && approved !== 1) {
    return res.status(400).json({ msg: "approved must be 0 or 1" });
  }
  db.query(
    "UPDATE users SET approved = ? WHERE id = ?",
    [approved, id],
    (err, result) => {
      if (err) return res.status(500).json({ msg: "DB error", err });
      if (result.affectedRows === 0)
        return res.status(404).json({ msg: "User not found" });
      res.json({ msg: `User ${id} approval set to ${approved}` });
    }
  );
};

// PUT /api/admin/users/:id/role   body: { role: "buyer" | "seller" | "admin" }
exports.setUserRole = (req, res) => {
  const userId = req.user.id; // comes from JWT middleware
  const { role } = req.body;

  const allowedRoles = ["buyer", "seller", "visitor"];

  if (!allowedRoles.includes(role)) {
    return res
      .status(400)
      .json({ msg: `role must be one of: ${allowedRoles.join(", ")}` });
  }

  db.query(
    "UPDATE users SET role = ? WHERE id = ?",
    [role, userId],
    (err, result) => {
      if (err) return res.status(500).json({ msg: "DB error", err });
      if (result.affectedRows === 0)
        return res.status(404).json({ msg: "User not found" });
      res.json({ msg: `Your role has been changed to ${role}` });
    }
  );
};

// PUT /api/admin/items/:id/status  body: { status: 0|1 }
exports.setItemStatus = (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  if (status !== 0 && status !== 1) {
    return res
      .status(400)
      .json({ msg: "status must be 0 (pending) or 1 (active)" });
  }
  db.query(
    "UPDATE items SET status = ? WHERE id = ?",
    [status, id],
    (err, result) => {
      if (err) return res.status(500).json({ msg: "DB error", err });
      if (result.affectedRows === 0)
        return res.status(404).json({ msg: "Item not found" });
      res.json({ msg: `Item ${id} status set to ${status}` });
    }
  );
};
