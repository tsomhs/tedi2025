const db = require("../config/db");
const jwt = require("jsonwebtoken");

exports.setOwnRole = (req, res) => {
  const userId = req.user.id;
  const { role } = req.body;

  const allowedRoles = ["buyer", "seller", "visitor"];
  if (!allowedRoles.includes(role)) {
    return res
      .status(400)
      .json({ msg: `role must be one of: ${allowedRoles.join(", ")}` });
  }

  db.query(
    "UPDATE users SET role = ? WHERE id = ?", //  check column name
    [role, userId],
    (err, result) => {
      if (err) return res.status(500).json({ msg: "DB error", err });
      if (result.affectedRows === 0)
        return res.status(404).json({ msg: "User not found" });

      const newToken = jwt.sign({ id: userId, role }, "SECRET_KEY", {
        expiresIn: "1h",
      });
      console.log("New token issued:", newToken);

      res.json({
        msg: `Your role has been changed to ${role}`,
        token: newToken,
      });
    }
  );
};

exports.getOwnInfo = (req, res) => {
  const userId = req.user.id; // set by auth middleware

  db.query(
    "SELECT id, username, role FROM users WHERE id = ?",
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ msg: "DB error", err });
      if (results.length === 0)
        return res.status(404).json({ msg: "User not found" });

      res.json({ user: results[0] });
    }
  );
};

exports.getUserById = (req, res) => {
  const userId = req.params.id; // get user ID from URL params

  db.query(
    "SELECT id, username, role, email, first_name, last_name FROM users WHERE id = ?",
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ msg: "DB error", err });
      if (results.length === 0)
        return res.status(404).json({ msg: "User not found" });

      res.json({ user: results[0] });
    }
  );
};
