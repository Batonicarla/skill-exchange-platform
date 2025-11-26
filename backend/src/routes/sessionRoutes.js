const express = require('express');
const router = express.Router();
const {
  proposeSession,
  respondToSession,
  getUserSessions,
  getSessionDetails,
  cancelSession
} = require('../controllers/sessionController');
const { verifyToken } = require('../middleware/auth');
const { sessionValidation } = require('../utils/validators');

// All routes require authentication
router.use(verifyToken);

// Session routes
router.post('/propose', sessionValidation, proposeSession);
router.put('/:sessionId/respond', respondToSession);
router.get('/', getUserSessions);
router.get('/:sessionId', getSessionDetails);
router.put('/:sessionId/cancel', cancelSession);

module.exports = router;

