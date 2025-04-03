const { body, validationResult } = require('express-validator');
const authService = require('../services/auth.service');
const { asyncHandler, errorTypes } = require('../utils/error-handler');

/**
 * Login validation rules
 */
const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email address'),
  body('password').notEmpty().withMessage('Password is required')
];

/**
 * Registration validation rules
 */
const registerValidation = [
  body('token').notEmpty().withMessage('Invitation token is required'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
];

/**
 * Token refresh validation rules
 */
const refreshTokenValidation = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
];

/**
 * Validate invitation token validation rules
 */
const validateInvitationValidation = [
  body('token').notEmpty().withMessage('Invitation token is required')
];

/**
 * Login controller
 */
const login = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw errorTypes.VALIDATION(errors.array()[0].msg);
  }

  const { email, password } = req.body;
  const { user, tokens } = await authService.login(email, password);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user,
      tokens
    }
  });
});

/**
 * Registration controller
 */
const register = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw errorTypes.VALIDATION(errors.array()[0].msg);
  }

  const { token, firstName, lastName, password } = req.body;
  const { user, tokens } = await authService.register(token, {
    firstName,
    lastName,
    password
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user,
      tokens
    }
  });
});

/**
 * Token refresh controller
 */
const refreshToken = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw errorTypes.VALIDATION(errors.array()[0].msg);
  }

  const { refreshToken: token } = req.body;
  const tokens = await authService.refreshToken(token);

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: tokens
  });
});

/**
 * Validate invitation token controller
 */
const validateInvitation = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw errorTypes.VALIDATION(errors.array()[0].msg);
  }

  const { token } = req.body;
  const invitation = await authService.validateInvitation(token);

  res.status(200).json({
    success: true,
    message: 'Invitation is valid',
    data: invitation
  });
});

module.exports = {
  loginValidation,
  registerValidation,
  refreshTokenValidation,
  validateInvitationValidation,
  login,
  register,
  refreshToken,
  validateInvitation
};