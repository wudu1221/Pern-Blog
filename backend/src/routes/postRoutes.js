// backend/src/routes/postRoutes.js
const express = require('express');
const postController = require('../controllers/postController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

// PUBLIC ROUTES - Open to anyone (Anonymous Readers)
router.get('/', postController.getAllPublishedPosts);


// SECURE ROUTES - Requires Login + Specific Privileges
router.post('/', protect, restrictTo('publisher', 'admin'), postController.createPost);
// Append these underneath your existing post routes

//router.get('/my-dashboard/articles', protect, restrictTo('publisher', 'admin'), postController.getPublisherPosts);
router.get('/my-articles', protect, postController.getMyArticles);
router.put('/:id', protect, restrictTo('publisher', 'admin'), postController.updatePost);
router.delete('/:id', protect, restrictTo('publisher', 'admin'), postController.deletePost);
router.get('/:slug', postController.getPostBySlug);

module.exports = router;