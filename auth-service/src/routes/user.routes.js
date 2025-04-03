const express = require('express');
const {
  getProfile,
  inviteUser,
  changePassword,
  updateProfile,
  getAllUsers,
  updateUser,
  inviteUserValidation,
  changePasswordValidation,
  updateUserValidation
} = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', getProfile);

/**
 * @route   POST /api/v1/users/invite
 * @desc    Invite a new user (admin only)
 * @access  Private (Admin)
 */
router.post('/invite', inviteUserValidation, inviteUser);

/**
 * @route   PATCH /api/v1/users/change-password
 * @desc    Change user's password
 * @access  Private
 */
router.patch('/change-password', changePasswordValidation, changePassword);

/**
 * @route   PATCH /api/v1/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.patch('/profile', updateUserValidation, updateProfile);

/**
 * @route   GET /api/v1/users
 * @desc    Get all users (admin only)
 * @access  Private (Admin)
 */
router.get('/', getAllUsers);

/**
 * @route   PATCH /api/v1/users/:userId
 * @desc    Update user (admin only)
 * @access  Private (Admin)
 */
router.patch('/:userId', updateUserValidation, updateUser);

module.exports = router;