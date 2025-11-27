const { body, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Auth validation rules
const registerValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('displayName').trim().notEmpty().withMessage('Display name is required'),
  validate
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

// Profile validation rules
const profileValidation = [
  body('displayName').optional().trim().notEmpty().withMessage('Display name cannot be empty'),
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters'),
  validate
];

// Skill validation rules
const skillValidation = [
  body('skillName').trim().notEmpty().withMessage('Skill name is required'),
  body('skillName').isLength({ max: 100 }).withMessage('Skill name must be less than 100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  validate
];

// Session validation rules
const sessionValidation = [
  body('partnerEmail').isEmail().withMessage('Valid partner email is required'),
  body('proposedDate').notEmpty().withMessage('Date is required'),
  body('proposedTime').notEmpty().withMessage('Time is required'),
  body('skill').trim().notEmpty().withMessage('Skill name is required'),
  validate
];

// Rating validation rules
const ratingValidation = [
  body('partnerId').notEmpty().withMessage('Partner ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional().isLength({ max: 1000 }).withMessage('Review must be less than 1000 characters'),
  validate
];

module.exports = {
  registerValidation,
  loginValidation,
  profileValidation,
  skillValidation,
  sessionValidation,
  ratingValidation,
  validate
};

