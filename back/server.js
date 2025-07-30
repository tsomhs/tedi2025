const express = require('express');
const cors = require('cors');

const app = express();

// Middleware: Επιτρέπει CORS (frontend-backend επικοινωνία)
app.use(cors());

// Middleware: Κάνει parsing το JSON που στέλνει το frontend
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

//διαχείριση δημοπρασιών (δημιουργία, εμφάνιση, λίστα)
const auctionRoutes = require('./routes/auction');
app.use('/api/auction', auctionRoutes);

//καταχώρηση και έλεγχος προσφορών σε δημοπρασίες
const bidRoutes = require('./routes/bids');
app.use('/api/bids', bidRoutes);

//αποστολή και ανάκτηση προσωπικών μηνυμάτων χρηστών
const messageRoutes = require('./routes/messages');
app.use('/api/messages', messageRoutes);

//εξαγωγή όλων των δημοπρασιών σε JSON ή XML
const exportRoutes = require('./routes/export');
app.use('/api/export', exportRoutes);

//διαχείριση αξιολογήσεων μεταξύ χρηστών 
const ratingRoutes = require('./routes/ratings');
app.use('/api/ratings', ratingRoutes);

//αποθήκευση ιστορικού και σύστημα προτάσεων 
const historyRoutes = require('./routes/history');
app.use('/api/history', historyRoutes);

// Εκκίνηση server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
