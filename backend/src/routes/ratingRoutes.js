const express = require('express');
const router = express.Router();
const { submitRating, getUserRatings } = require('../controllers/ratingController');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// Rating routes
router.post('/submit', submitRating);
router.get('/user/:userId', getUserRatings);

module.exports = router;