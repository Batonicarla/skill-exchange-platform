const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateProfile,
  addSkillToTeach,
  addSkillToLearn,
  removeSkillToTeach,
  removeSkillToLearn
} = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');
const { profileValidation, skillValidation } = require('../utils/validators');

// All routes require authentication
router.use(verifyToken);

// Profile routes
router.get('/profile/:userId', getUserProfile);
router.put('/profile', profileValidation, updateProfile);

// Skills routes
router.post('/skills/teach', skillValidation, addSkillToTeach);
router.post('/skills/learn', skillValidation, addSkillToLearn);
router.delete('/skills/teach/:skillName', removeSkillToTeach);
router.delete('/skills/learn/:skillName', removeSkillToLearn);

module.exports = router;

