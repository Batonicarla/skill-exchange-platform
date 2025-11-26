const express = require('express');
const router = express.Router();
const { submitRating, getUserRatings } = require('../controllers/ratingController');
const { verifyToken } = require('../middleware/auth');
const { ratingValidation } = require('../utils/validators');

// All routes require authentication
router.use(verifyToken);

// Rating routes
router.post('/', ratingValidation, submitRating);
router.get('/user/:userId', getUserRatings);

module.exports = router;

