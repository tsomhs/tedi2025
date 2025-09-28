const express = require("express");
const router = express.Router();
const exportController = require("../controllers/exportController");
const { verifyToken } = require("../middleware/authMiddleware");

// Εξαγωγή σε JSON (μόνο admin)
router.get("/json", verifyToken, exportController.exportToJSON);

// Εξαγωγή σε XML (μόνο admin)
router.get("/xml", verifyToken, exportController.exportToXML);

module.exports = router;
