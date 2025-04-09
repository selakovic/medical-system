const express = require('express');
const {
  login,
  register,
  refreshToken,
  validateInvitation,
  forgotPassword,
  resetPassword,
  validateResetToken,
  validateToken,
  loginValidation,
  registerValidation,
  refreshTokenValidation,
  validateInvitationValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  validateResetTokenValidation,
  validateTokenValidation
} = require('../controllers/auth.controller');

const router = express.Router();

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', loginValidation, login);

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user from invitation
 * @access  Public
 */
router.post('/register', registerValidation, register);

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh-token', refreshTokenValidation, refreshToken);

/**
 * @route   POST /api/v1/auth/validate-invitation
 * @desc    Validate invitation token
 * @access  Public
 */
router.post('/validate-invitation', validateInvitationValidation, validateInvitation);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', resetPasswordValidation, resetPassword);

/**
 * @route   POST /api/v1/auth/validate-reset-token
 * @desc    Validate password reset token
 * @access  Public
 */
router.post('/validate-reset-token', validateResetTokenValidation, validateResetToken);

/**
 * @route   POST /api/v1/auth/validate-token
 * @desc    Validate JWT token
 * @access  Public
 */
router.post('/validate-token', validateTokenValidation, validateToken);

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Resend verification email
 * @access  Public
 */
router.post('/resend-verification', [
  body('email').isEmail().withMessage('Please enter a valid email address')
], resendVerification);

module.exports = router;