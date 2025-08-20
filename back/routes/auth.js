//routes/auth.js

const express = require("express");
const router = express.Router();

// Εδώ φέρνεις τη λογική από τον controller
const authController = require("../controllers/authController");

// POST /api/auth/register  --> καλεί register()
router.post("/register", authController.register);

// POST /api/auth/login  --> καλεί login()
router.post("/login", authController.login);

module.exports = router;
