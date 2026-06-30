// backend/src/routes/userRoutes.js
const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

// Publicly viewable profile space (No login middleware needed)
router.get('/publisher/:id', userController.getPublisherProfile);

module.exports = router;