// backend/src/routes/authRoutes.js
const express = require('express');
const authController = require('../controllers/authController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

// Publicly accessible identity routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Quick diagnostic endpoint to test token protection and role checking
router.get('/admin-only-test', protect, restrictTo('admin'), (req, res) => {
  res.status(200).json({
    message: `Access granted! Hello Admin ${req.user.full_name}. This route is secure.`
  });
});

module.exports = router;