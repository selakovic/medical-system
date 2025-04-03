const axios = require('axios');
const { User, Invitation } = require('../models');
const adminConfig = require('../config/admin');
const appConfig = require('../config/app');
const logger = require('../utils/logger');
const { errorTypes } = require('../utils/error-handler');

/**
 * Service for user management
 */
class UserService {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @param {Object} [invitation] - Optional invitation object
   * @returns {Promise<User>} Created user
   */
  async createUser(userData, invitation = null) {
    try {
      // Validate user data
      if (!userData.email) {
        throw errorTypes.VALIDATION('Email is required');
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        where: { email: userData.email.toLowerCase() }
      });

      if (existingUser) {
        throw errorTypes.CONFLICT(`User with email ${userData.email} already exists`);
      }

      // Create new user
      const user = await User.create({
        email: userData.email.toLowerCase(),
        firstName: userData.firstName,
        lastName: userData.lastName,
        password: userData.password,
        role: invitation ? invitation.role : 'user',
        isActive: true // Set active immediately
      });

      logger.info(`Created new user: ${user.email}`);

      // If invitation exists, mark it as accepted
      if (invitation) {
        await invitation.markAsAccepted();
      }

      return user;
    } catch (error) {
      if (error.statusCode) throw error; // Re-throw ApiErrors
      logger.error('Error creating user:', error);
      throw errorTypes.INTERNAL('Failed to create user');
    }
  }

  /**
   * Invite a new user
   * @param {Object} invitationData - Invitation data
   * @param {Object} invitedBy - User who sent the invitation
   * @returns {Promise<Invitation>} Created invitation
   */
  async inviteUser(invitationData, invitedBy) {
    try {
      // Validate invitation data
      if (!invitationData.email) {
        throw errorTypes.VALIDATION('Email is required');
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        where: { email: invitationData.email.toLowerCase() }
      });

      if (existingUser) {
        throw errorTypes.CONFLICT(`User with email ${invitationData.email} already exists`);
      }

      // Check if there's already an active invitation
      const existingInvitation = await Invitation.findActiveByEmail(invitationData.email.toLowerCase());
      
      if (existingInvitation) {
        throw errorTypes.CONFLICT(`Active invitation for ${invitationData.email} already exists`);
      }

      // Create new invitation
      const expiresAt = new Date(Date.now() + adminConfig.userInvitationExpiry);
      
      const invitation = await Invitation.create({
        email: invitationData.email.toLowerCase(),
        role: invitationData.role || 'user',
        expiresAt,
        invitedById: invitedBy.id
      });

      // Send invitation email
      await this.sendUserInvitation(invitation);

      logger.info(`Created and sent invitation to ${invitation.email}`);
      
      return invitation;
    } catch (error) {
      if (error.statusCode) throw error; // Re-throw ApiErrors
      logger.error('Error inviting user:', error);
      throw errorTypes.INTERNAL('Failed to invite user');
    }
  }

  /**
   * Send user invitation email
   * @param {Object} invitation - Invitation object
   * @returns {Promise<void>}
   */
  async sendUserInvitation(invitation) {
    try {
      // Create registration link
      const registrationLink = `${appConfig.frontendUrls.base}/register?token=${invitation.token}`;
      
      // Send notification using notification service
      await axios.post(appConfig.notificationService.url, {
        type: 'user-invitation',
        recipient: invitation.email,
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
      
      logger.info(`Sent user invitation to ${invitation.email}`);
    } catch (error) {
      logger.error('Error sending user invitation:', error);
      throw errorTypes.INTERNAL('Failed to send user invitation');
    }
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<User>} User object
   */
  async getUserById(userId) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw errorTypes.NOT_FOUND(`User with ID ${userId} not found`);
      }
      
      return user;
    } catch (error) {
      if (error.statusCode) throw error; // Re-throw ApiErrors
      logger.error('Error getting user by ID:', error);
      throw errorTypes.INTERNAL('Failed to get user');
    }
  }

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Promise<User>} User object
   */
  async getUserByEmail(email) {
    try {
      const user = await User.findOne({
        where: { email: email.toLowerCase() }
      });
      
      if (!user) {
        throw errorTypes.NOT_FOUND(`User with email ${email} not found`);
      }
      
      return user;
    } catch (error) {
      if (error.statusCode) throw error; // Re-throw ApiErrors
      logger.error('Error getting user by email:', error);
      throw errorTypes.INTERNAL('Failed to get user');
    }
  }

  /**
   * Update user information
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<User>} Updated user
   */
  async updateUser(userId, updateData) {
    try {
      const user = await this.getUserById(userId);
      
      // Update user fields
      const allowedFields = ['firstName', 'lastName', 'isActive'];
      
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          user[field] = updateData[field];
        }
      });
      
      await user.save();
      logger.info(`Updated user: ${user.email}`);
      
      return user;
    } catch (error) {
      if (error.statusCode) throw error; // Re-throw ApiErrors
      logger.error('Error updating user:', error);
      throw errorTypes.INTERNAL('Failed to update user');
    }
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Get user with password included
      const user = await User.scope('withPassword').findByPk(userId);
      
      if (!user) {
        throw errorTypes.NOT_FOUND(`User with ID ${userId} not found`);
      }
      
      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      
      if (!isMatch) {
        throw errorTypes.UNAUTHORIZED('Current password is incorrect');
      }
      
      // Update password
      user.password = newPassword;
      await user.save();
      
      logger.info(`Password changed for user: ${user.email}`);
    } catch (error) {
      if (error.statusCode) throw error; // Re-throw ApiErrors
      logger.error('Error changing password:', error);
      throw errorTypes.INTERNAL('Failed to change password');
    }
  }
}

module.exports = new UserService();