const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getChatHistory,
  getUserChats,
  markAsRead
} = require('../controllers/chatController');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// Chat routes
router.post('/send', sendMessage);
router.get('/chats', getUserChats);
router.get('/history/:partnerId', getChatHistory);
router.put('/read/:partnerId', markAsRead);

module.exports = router;

