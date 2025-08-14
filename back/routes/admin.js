const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');

router.use(verifyToken, requireRole('admin'));

router.get('/users', adminController.listUsers);
router.put('/users/:id/approve', adminController.setUserApproval);
router.put('/items/:id/status', adminController.setItemStatus);

module.exports = router;
