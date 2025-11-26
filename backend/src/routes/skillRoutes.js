const express = require('express');
const router = express.Router();
const { searchBySkill, getMatches, getAllUsers } = require('../controllers/skillController');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// Search and matching routes
router.get('/search', searchBySkill);
router.get('/matches', getMatches);
router.get('/users', getAllUsers);

module.exports = router;

