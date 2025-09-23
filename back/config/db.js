//config/db.js

const mysql = require("mysql2");

// Δημιουργεί τη σύνδεση με τη MySQL
const db = mysql.createConnection({
  host: "localhost", //Αν τρέχεις τοπικά
  user: "root", //Χρήστης MySQL (π.χ. root)
  password: "9004", // Ο κωδικός σου στη MySQL
  database: "auction_db", // Το όνομα της βάσης σου
  dateStrings: true,
});

// Συνδέεται και εμφανίζει μήνυμα
db.connect((err) => {
  if (err) {
    console.error("MySQL connection failed:", err);
    process.exit(1); // Σταματάει αν δεν μπορεί να συνδεθεί
  }
  console.log("MySQL connected!");
});

// Το exportάρεις για να το χρησιμοποιούν άλλα αρχεία
module.exports = db;
