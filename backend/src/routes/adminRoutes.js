const express = require('express');
const router = express.Router();
const {
  removeUser,
  getReports,
  resolveReport,
  moderateContent,
  getAdminLogs,
  getAllUsersAdmin
} = require('../controllers/adminController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(verifyToken);
router.use(verifyAdmin);

// Admin routes
router.delete('/users/:userId', removeUser);
router.get('/reports', getReports);
router.put('/reports/:reportId/resolve', resolveReport);
router.post('/moderate', moderateContent);
router.get('/logs', getAdminLogs);
router.get('/users', getAllUsersAdmin);

module.exports = router;

