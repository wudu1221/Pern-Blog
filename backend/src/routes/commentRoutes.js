// backend/src/routes/commentRoutes.js
const express = require('express');
const commentController = require('../controllers/commentController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Publicly viewable comments on an article
router.get('/post/:postId', commentController.getPostComments);

// Strictly protected routes requiring standard login authorization
router.post('/', protect, commentController.createComment);
router.put('/:id', protect, commentController.updateComment);
router.delete('/:id', protect, commentController.deleteComment);

module.exports = router;