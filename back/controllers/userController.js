// controllers/userController.js
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
    "UPDATE users SET role = ? WHERE id = ?", // ✅ check column name
    [role, userId],
    (err, result) => {
      if (err) return res.status(500).json({ msg: "DB error", err });
      if (result.affectedRows === 0)
        return res.status(404).json({ msg: "User not found" });

      // ✅ issue a new JWT with the updated role
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
