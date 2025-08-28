//middleware/authMiddleware.js

const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET || "SECRET_KEY";

// Middleware για έλεγχο αν το JWT token είναι έγκυρο
exports.verifyToken = (req, res, next) => {
  const bearer = req.headers["authorization"];
  if (!bearer) return res.status(403).json({ msg: "No token provided" });

  const token = bearer.split(" ")[1];
  if (!token) return res.status(403).json({ msg: "Token missing" });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(403).json({ msg: "Invalid or expired token" });
    req.user = decoded; // { id, role }
    next();
  });
};

exports.requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ msg: "Forbidden: insufficient role" });
  }
  next();
};
