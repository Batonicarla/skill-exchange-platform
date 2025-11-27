const express = require('express');
const router = express.Router();
const { submitRating } = require('../controllers/ratingController');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// Rating routes
router.post('/', submitRating);

module.exports = router;