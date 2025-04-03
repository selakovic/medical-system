const { body, validationResult } = require('express-validator');
const userService = require('../services/user.service');
const { asyncHandler, errorTypes } = require('../utils/error-handler');

/**
 * User invitation validation rules
 */
const inviteUserValidation = [
  body('email').isEmail().withMessage('Please enter a valid email address'),
  body('role').isIn(['admin', 'user']).withMessage('Role must be either "admin" or "user"')
];

/**
 * Change password validation rules
 */
const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
];

/**
 * Update user validation rules
 */
const updateUserValidation = [
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
];

/**
 * Get current user profile
 */
const getProfile = asyncHandler(async (req, res) => {
  // User is already loaded in req.user by auth middleware
  res.status(200).json({
    success: true,
    data: req.user
  });
});

/**
 * Invite a new user
 */
const inviteUser = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw errorTypes.VALIDATION(errors.array()[0].msg);
  }

  // Check if user is admin
  if (req.user.role !== 'admin') {
    throw errorTypes.FORBIDDEN('Only admin users can invite new users');
  }

  const { email, role } = req.body;
  const invitation = await userService.inviteUser({ email, role }, req.user);

  res.status(201).json({
    success: true,
    message: `Invitation sent to ${email}`,
    data: {
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt
    }
  });
});

/**
 * Change user password
 */
const changePassword = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw errorTypes.VALIDATION(errors.array()[0].msg);
  }

  const { currentPassword, newPassword } = req.body;
  await userService.changePassword(req.user.id, currentPassword, newPassword);

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

/**
 * Update user profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw errorTypes.VALIDATION(errors.array()[0].msg);
  }

  const { firstName, lastName } = req.body;
  const updatedUser = await userService.updateUser(req.user.id, { firstName, lastName });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedUser
  });
});

/**
 * Get all users (admin only)
 */
const getAllUsers = asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    throw errorTypes.FORBIDDEN('Only admin users can access this resource');
  }

  const users = await User.findAll();

  res.status(200).json({
    success: true,
    data: users
  });
});

/**
 * Update user (admin only)
 */
const updateUser = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw errorTypes.VALIDATION(errors.array()[0].msg);
  }

  // Check if user is admin
  if (req.user.role !== 'admin') {
    throw errorTypes.FORBIDDEN('Only admin users can update other users');
  }

  const { userId } = req.params;
  const { firstName, lastName, isActive } = req.body;
  
  const updatedUser = await userService.updateUser(userId, { firstName, lastName, isActive });

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: updatedUser
  });
});

module.exports = {
  inviteUserValidation,
  changePasswordValidation,
  updateUserValidation,
  getProfile,
  inviteUser,
  changePassword,
  updateProfile,
  getAllUsers,
  updateUser
};