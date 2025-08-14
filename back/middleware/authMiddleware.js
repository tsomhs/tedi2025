//middleware/authMiddleware.js

const jwt = require('jsonwebtoken');

// Middleware για έλεγχο αν το JWT token είναι έγκυρο
exports.verifyToken = (req, res, next) => {
  // Παίρνει το Authorization header
  const bearer = req.headers['authorization'];

  // Αν δεν υπάρχει, κόβει
  if (!bearer) return res.status(403).json({ msg: 'No token provided' });

  // Το token έρχεται συνήθως ως: "Bearer TOKEN"
  const token = bearer.split(' ')[1];

  // Το ελέγχει με το SECRET_KEY
  jwt.verify(token, 'SECRET_KEY', (err, decoded) => {
    if (err) return res.status(403).json({ msg: 'Invalid or expired token' });

    // Αν όλα ΟΚ, σώζει τα δεδομένα στο req.user για να τα χρησιμοποιήσεις μετά
    req.user = decoded; // { id, role }
    next();
  });
};

exports.requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ msg: 'Forbidden: insufficient role' });
  }
  next();
};