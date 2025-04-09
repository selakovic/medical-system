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

/**
 * Forgot password validation rules
 */
const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Please enter a valid email address')
];

/**
 * Reset password validation rules
 */
const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
];

/**
 * Validate reset token validation rules
 */
const validateResetTokenValidation = [
  body('token').notEmpty().withMessage('Reset token is required')
];

/**
 * Forgot password controller
 */
const forgotPassword = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw errorTypes.VALIDATION(errors.array()[0].msg);
  }

  const { email } = req.body;
  await authService.sendPasswordResetLink(email);

  res.status(200).json({
    success: true,
    message: 'If a user with that email exists, a password reset link has been sent.'
  });
});

/**
 * Reset password controller
 */
const resetPassword = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw errorTypes.VALIDATION(errors.array()[0].msg);
  }

  const { token, password } = req.body;
  await authService.resetPassword(token, password);

  res.status(200).json({
    success: true,
    message: 'Password has been reset successfully.'
  });
});

/**
 * Validate reset token controller
 */
const validateResetToken = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw errorTypes.VALIDATION(errors.array()[0].msg);
  }

  const { token } = req.body;
  const isValid = await authService.validatePasswordResetToken(token);

  if (isValid) {
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: { isValid: true }
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Token is invalid or expired',
      data: { isValid: false }
    });
  }
});

/**
 * Token validation validation rules
 */
const validateTokenValidation = [
  body('token').notEmpty().withMessage('Token is required')
];

/**
 * Validate token controller
 */
const validateToken = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw errorTypes.VALIDATION(errors.array()[0].msg);
  }

  const { token } = req.body;
  const tokenData = await authService.validateToken(token);

  if (tokenData.valid) {
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: tokenData
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Token is invalid or expired',
      data: tokenData
    });
  }
});

/**
 * Resend verification email validation rules
 */
const resendVerificationValidation = [
  body('email').isEmail().withMessage('Please enter a valid email address')
];

/**
 * Resend verification email controller
 */
const resendVerification = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw errorTypes.VALIDATION(errors.array()[0].msg);
  }

  const { email } = req.body;
  await authService.resendVerificationEmail(email);

  res.status(200).json({
    success: true,
    message: 'Verification email resent if account exists'
  });
});

module.exports = {
  loginValidation,
  registerValidation,
  refreshTokenValidation,
  validateInvitationValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  validateResetTokenValidation,
  validateTokenValidation,
  resendVerificationValidation,
  login,
  register,
  refreshToken,
  validateInvitation,
  forgotPassword,
  resetPassword,
  validateResetToken,
  validateToken,
  resendVerification
};