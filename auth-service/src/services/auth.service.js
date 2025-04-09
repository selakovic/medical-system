const axios = require('axios');
const crypto = require('crypto');
const { Op } = require('sequelize');
const adminConfig = require('../config/admin');
const appConfig = require('../config/app');
const { User, Invitation } = require('../models');
const tokenService = require('./token.service');
const logger = require('../utils/logger');
const { errorTypes } = require('../utils/error-handler');

/**
 * Service for authentication
 */
class AuthService {
  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User and tokens
   */
  async login(email, password) {
    try {
      // Find user with password included
      const user = await User.scope('withPassword').findOne({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        throw errorTypes.UNAUTHORIZED('Invalid email or password');
      }

      // Check if account is locked
      if (user.isAccountLocked()) {
        const waitTime = Math.ceil((user.lockedUntil - new Date()) / 1000 / 60);
        throw errorTypes.UNAUTHORIZED(`Account is locked. Please try again in ${waitTime} minutes.`);
      }

      // Verify password
      const isMatch = await user.comparePassword(password);

      if (!isMatch) {
        // Register failed login attempt
        await user.registerFailedLogin();
        throw errorTypes.UNAUTHORIZED('Invalid email or password');
      }

      // Reset failed login attempts
      await user.resetFailedLoginAttempts();

      // Generate tokens
      const tokens = tokenService.generateTokens(user);

      // Return user (without password) and tokens
      return {
        user,
        tokens
      };
    } catch (error) {
      if (error.statusCode) throw error; // Re-throw ApiErrors
      logger.error('Error during login:', error);
      throw errorTypes.INTERNAL('Login failed');
    }
  }

  /**
   * Register a new user from invitation
   * @param {string} token - Invitation token
   * @param {Object} userData - User data
   * @returns {Promise<Object>} User and tokens
   */
  async register(token, userData) {
    try {
      // Find active invitation by token
      const invitation = await Invitation.findActiveByToken(token);

      if (!invitation) {
        throw errorTypes.UNAUTHORIZED('Invalid or expired invitation token');
      }

      // Verify that email matches invitation
      if (userData.email && userData.email.toLowerCase() !== invitation.email) {
        throw errorTypes.FORBIDDEN('Email does not match invitation');
      }

      // Create new user with invitation data
      const user = await User.create({
        email: invitation.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        password: userData.password,
        role: invitation.role,
        isActive: true
      });

      // Mark invitation as accepted
      invitation.isAccepted = true;
      invitation.acceptedAt = new Date();
      await invitation.save();

      // Generate tokens
      const tokens = tokenService.generateTokens(user);

      logger.info(`New user registered: ${user.email}`);

      return {
        user,
        tokens
      };
    } catch (error) {
      if (error.statusCode) throw error; // Re-throw ApiErrors
      logger.error('Error during registration:', error);
      throw errorTypes.INTERNAL('Registration failed');
    }
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New tokens
   */
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = tokenService.verifyRefreshToken(refreshToken);

      // Get user
      const user = await User.findByPk(decoded.sub);

      if (!user) {
        throw errorTypes.UNAUTHORIZED('Invalid token');
      }

      // Generate new tokens
      const tokens = tokenService.generateTokens(user);

      return tokens;
    } catch (error) {
      if (error.statusCode) throw error; // Re-throw ApiErrors
      logger.error('Error refreshing token:', error);
      throw errorTypes.INTERNAL('Token refresh failed');
    }
  }

  /**
   * Validate invitation token
   * @param {string} token - Invitation token
   * @returns {Promise<Object>} Invitation data
   */
  async validateInvitation(token) {
    try {
      // Find active invitation by token
      const invitation = await Invitation.findActiveByToken(token);

      if (!invitation) {
        throw errorTypes.UNAUTHORIZED('Invalid or expired invitation token');
      }

      return {
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt
      };
    } catch (error) {
      if (error.statusCode) throw error; // Re-throw ApiErrors
      logger.error('Error validating invitation:', error);
      throw errorTypes.INTERNAL('Invitation validation failed');
    }
  }

  async sendPasswordResetLink(email) {
    try {
      // Find user by email
      const user = await User.findOne({
        where: { email: email.toLowerCase() }
      });

      // For security reasons, don't reveal if email exists or not
      if (!user) {
        logger.info(`Password reset requested for non-existent email: ${email}`);
        return;
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Update user with reset token
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = expiresAt;
      await user.save();

      // Create reset link
      const resetLink = `${appConfig.frontendUrls.base}/reset-password?token=${resetToken}`;

      // Send email via notification service
      try {
        await axios.post(appConfig.notificationService.url, {
          type: 'password-reset',
          recipient: user.email,
          data: {
            resetLink,
            expiresAt
          }
        }, {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': appConfig.notificationService.apiKey
          }
        });

        logger.info(`Password reset email sent to ${user.email}`);
      } catch (error) {
        logger.error('Error sending password reset email:', error);
        throw errorTypes.INTERNAL('Failed to send password reset email');
      }
    } catch (error) {
      if (error.statusCode) throw error; // Re-throw ApiErrors
      logger.error('Error in sendPasswordResetLink:', error);
      throw errorTypes.INTERNAL('Failed to process password reset request');
    }
  }

  /**
   * Validate password reset token
   * @param {string} token - Reset token
   * @returns {Promise<boolean>} True if token is valid
   */
  async validatePasswordResetToken(token) {
    try {
      const user = await User.findOne({
        where: {
          passwordResetToken: token,
          passwordResetExpires: { [Op.gt]: new Date() }
        }
      });

      return !!user;
    } catch (error) {
      logger.error('Error validating password reset token:', error);
      throw errorTypes.INTERNAL('Failed to validate reset token');
    }
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async resetPassword(token, newPassword) {
    try {
      const user = await User.scope('withPassword').findOne({
        where: {
          passwordResetToken: token,
          passwordResetExpires: { [Op.gt]: new Date() }
        }
      });

      if (!user) {
        throw errorTypes.UNAUTHORIZED('Invalid or expired reset token');
      }

      // Update password
      user.password = newPassword;
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save();

      logger.info(`Password reset successfully for ${user.email}`);
    } catch (error) {
      if (error.statusCode) throw error; // Re-throw ApiErrors
      logger.error('Error in resetPassword:', error);
      throw errorTypes.INTERNAL('Failed to reset password');
    }
  }

  /**
 * Validate JWT token
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Decoded token data or null
 */
  async validateToken(token) {
    try {
      // Try to verify as access token first
      try {
        const decoded = tokenService.verifyAccessToken(token);

        // Check if user exists and is active
        const user = await User.findByPk(decoded.sub);
        if (!user || !user.isActive) {
          return { valid: false, reason: 'User not found or inactive' };
        }

        return {
          valid: true,
          type: 'access',
          userId: decoded.sub,
          role: decoded.role
        };
      } catch (accessError) {
        // If not an access token, try as refresh token
        try {
          const decoded = tokenService.verifyRefreshToken(token);

          // Check if user exists
          const user = await User.findByPk(decoded.sub);
          if (!user) {
            return { valid: false, reason: 'User not found' };
          }

          return {
            valid: true,
            type: 'refresh',
            userId: decoded.sub
          };
        } catch (refreshError) {
          // Not a valid token of either type
          return { valid: false, reason: 'Invalid token' };
        }
      }
    } catch (error) {
      logger.error('Error validating token:', error);
      throw errorTypes.INTERNAL('Failed to validate token');
    }
  }

  /**
   * Resend verification email
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  async resendVerificationEmail(email) {
    try {
      // Find user with provided email
      const user = await User.findOne({ where: { email: email.toLowerCase() } });

      // Early return if user doesn't exist or is already verified
      // We don't want to reveal whether an email exists in the system
      if (!user || user.isActive) {
        return;
      }

      // Get existing unaccepted invitation for this user
      const invitation = await Invitation.findOne({
        where: {
          email: email.toLowerCase(),
          isAccepted: false
        }
      });

      if (!invitation) {
        // If no invitation exists, we can't resend
        return;
      }

      // Generate a new token if the current one has expired
      if (invitation.expiresAt < new Date()) {
        // Set new expiration date
        invitation.expiresAt = new Date(Date.now() + adminConfig.userInvitationExpiry);
        // Regenerate the token
        invitation.token = uuidv4();
        await invitation.save();
      }

      // Send notification to user
      try {
        const registrationLink = `${appConfig.frontendUrls.base}/register?token=${invitation.token}`;

        await axios.post(appConfig.notificationService.url, {
          type: 'user-invitation',
          recipient: email,
          data: {
            registrationLink,
            expiresAt: invitation.expiresAt
          }
        }, {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': appConfig.notificationService.apiKey
          }
        });

        logger.info(`Resent verification email to ${email}`);
      } catch (error) {
        // Log error but don't throw - we don't want to reveal if email exists
        logger.error(`Failed to send verification email to ${email}:`, error);
      }
    } catch (error) {
      // Log error but don't throw for security
      logger.error('Error resending verification email:', error);
    }
  }
}

module.exports = new AuthService();