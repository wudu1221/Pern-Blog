// backend/src/routes/postRoutes.js
const express = require('express');
const postController = require('../controllers/postController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// 1. Use your custom configured upload middleware (handles file paths, extensions, etc.)
const upload = require('../middlewares/upload');

const router = express.Router();

// 2. PUBLIC GENERAL ROUTES
router.get('/', postController.getAllPublishedPosts);

// 3. SPECIFIC DASHBOARD ROUTES (Must be ABOVE /:slug)
router.get('/my-articles', protect, postController.getMyArticles);
router.get('/my-analytics', protect, postController.getMyAnalytics);

// 4. DYNAMIC PARAMETER ROUTES (Put these at the bottom so they don't hijack other requests!)
router.get('/:slug', postController.getPostBySlug);

// 5. SECURE MUTATION ROUTES (Restricted to publisher and admin roles)
router.post(
  '/', 
  protect, 
  restrictTo('publisher', 'admin'), 
  upload.single('coverImage'), // Key: matches React's formData.append('coverImage', ...)
  postController.createPost
);

router.put(
  '/:id', 
  protect, 
  restrictTo('publisher', 'admin'), 
  upload.single('coverImage'), // Added this so you can also update/replace the image!
  postController.updatePost
);

router.delete(
  '/:id', 
  protect, 
  restrictTo('publisher', 'admin'), 
  postController.deletePost
);

module.exports = router;