const express = require('express');
const {
  login,
  register,
  refreshToken,
  validateInvitation,
  loginValidation,
  registerValidation,
  refreshTokenValidation,
  validateInvitationValidation
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

module.exports = router;