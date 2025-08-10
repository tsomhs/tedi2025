//controllers/authController.js

const db = require("../config/db"); // σύνδεση με MySQL
const bcrypt = require("bcryptjs"); // κρυπτογράφηση κωδικού
const jwt = require("jsonwebtoken"); // δημιουργία JWT token

//REGISTER

exports.register = (req, res) => {
  const { username, password, email } = req.body;

  // Απλός έλεγχος αν έστειλε όλα τα πεδία
  if (!username || !password || !email) {
    return res.status(400).json({ msg: "Fill all fields" });
  }

  // Έλεγχος αν υπάρχει ήδη το username
  db.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    (err, results) => {
      if (err) throw err;

      if (results.length > 0) {
        return res.status(409).json({ msg: "Username already exists" });
      }

      // Αν ΟΚ, κρυπτογράφηση κωδικού
      const hashed = bcrypt.hashSync(password, 10);

      // Εισαγωγή χρήστη στη βάση με approved = 0 (περιμένει έγκριση admin)
      db.query(
        "INSERT INTO users (username, password, email, role, approved) VALUES (?, ?, ?, ?, ?)",
        [username, hashed, email, "visitor", 0],
        (err) => {
          if (err) throw err;
          res.json({ msg: "Registration success. Wait for admin approval." });
        }
      );
    }
  );
};

//LOGIN

exports.login = (req, res) => {
  const { username, password } = req.body;

  // Ψάχνει τον χρήστη στη βάση
  db.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    (err, results) => {
      if (err) throw err;

      if (results.length === 0) {
        return res.status(400).json({ msg: "User not found" });
      }

      const user = results[0];

      // Ελέγχει αν ο κωδικός ταιριάζει
      if (!bcrypt.compareSync(password, user.password)) {
        return res.status(400).json({ msg: "Invalid password" });
      }

      // Ελέγχει αν έχει εγκριθεί από admin
      if (!user.approved) {
        return res.status(403).json({ msg: "User not approved by admin." });
      }

      // Δημιουργεί JWT token με το id και το role του χρήστη
      const token = jwt.sign(
        { id: user.id, role: user.role },
        "SECRET_KEY",
        { expiresIn: "1h" } // ισχύει για 1 ώρα
      );

      res.json({ token });
    }
  );
};
