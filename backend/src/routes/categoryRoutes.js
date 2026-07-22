// backend/src/routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// Public route to get all categories
router.get('/', categoryController.getAllCategories);

module.exports = router;