const { body, validationResult } = require('express-validator');

/**
 * VALIDATE INPUT MIDDLEWARE
 * Uses express-validator to enforce data integrity before hitting controllers.
 */
const validateInput = {
  registerRules: [
    body('username')
      .isAlphanumeric()
      .withMessage('Username must be alphanumeric')
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters'),
    body('email').isEmail().withMessage('Please provide a valid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
  ],

  loginRules: [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],

  messageRules: [
    body('content').trim().notEmpty().withMessage('Message cannot be empty')
      .isLength({ max: 5000 }).withMessage('Message is too long')
  ],

  roomRules: [
    body('name').trim().isLength({ min: 3, max: 50 }).withMessage('Room name must be 3-50 characters')
  ],

  /**
   * Final validation check function
   */
  validate: (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
};

module.exports = validateInput;
