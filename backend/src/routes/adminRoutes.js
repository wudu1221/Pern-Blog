// backend/src/routes/adminRoutes.js
const express = require('express');
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

// Secure all paths to Administrators only
router.use(protect, restrictTo('admin'));

router.get('/pending-reviews', adminController.getPendingReviews);
router.patch('/posts/:id/status', adminController.updatePostStatus); // Milestone 5 exact path match
router.get('/comments', adminController.getAllCommentsForModeration);
router.patch('/comments/:id/approve', adminController.approveComment);

module.exports = router;