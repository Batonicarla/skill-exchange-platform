const express = require('express');
const router = express.Router();
const { register, login, resetPassword, getCurrentUser } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { registerValidation } = require('../utils/validators');

// Public routes
router.post('/register', registerValidation, register);

// Login can work with either email/password OR token verification
// No validation middleware needed since it handles both flows
router.post('/login', login);

router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', verifyToken, getCurrentUser);

module.exports = router;