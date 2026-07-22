// backend/src/routes/userRoutes.js
const express = require('express');
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

// Publicly viewable profile space (No login middleware needed)
router.put('/profile', protect, userController.updateMyProfile);
router.get('/publisher/:id', userController.getPublisherProfile);
router.get('/profile', protect, userController.getMyProfile);

module.exports = router;