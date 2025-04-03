const axios = require('axios');
const { Op } = require('sequelize');
const { User, Invitation } = require('../models');
const adminConfig = require('../config/admin');
const appConfig = require('../config/app');
const logger = require('../utils/logger');
const { errorTypes } = require('../utils/error-handler');

/**
 * Service for admin user management
 */
class AdminService {
  /**
   * Check if an admin user exists in the system
   * @returns {Promise<boolean>} True if admin exists, false otherwise
   */
  async checkAdminExists() {
    try {
      const adminUser = await User.findOne({
        where: { role: 'admin' }
      });
      
      return !!adminUser;
    } catch (error) {
      logger.error('Error checking admin existence:', error);
      throw errorTypes.INTERNAL('Database query failed');
    }
  }

  /**
   * Create admin invitation
   * @returns {Promise<Object>} Invitation object
   */
  async createAdminInvitation() {
    try {
      // Check if there's already an active invitation for admin
      const existingInvitation = await Invitation.findOne({
        where: {
          email: adminConfig.email,
          isAccepted: false,
          expiresAt: { [Op.gt]: new Date() }
        }
      });
      
      if (existingInvitation) {
        return existingInvitation;
      }
      
      // Create new invitation
      const expiresAt = new Date(Date.now() + adminConfig.invitationExpiry);
      
      const invitation = await Invitation.create({
        email: adminConfig.email,
        role: 'admin',
        expiresAt
      });
      
      logger.info(`Created admin invitation for ${adminConfig.email}`);
      
      return invitation;
    } catch (error) {
      logger.error('Error creating admin invitation:', error);
      throw errorTypes.INTERNAL('Failed to create admin invitation');
    }
  }

  /**
   * Send admin invitation email
   * @param {Object} invitation - Invitation object
   * @returns {Promise<void>}
   */
  async sendAdminInvitation(invitation) {
    try {
      // Create registration link
      const registrationLink = `${appConfig.frontendUrls.base}/register?token=${invitation.token}`;
      
      // Log the link for development purposes
      if (process.env.NODE_ENV === 'development') {
        logger.info(`[DEV] Admin registration link: ${registrationLink}`);
      }
      
      // Send notification using notification service
      try {
        await axios.post(appConfig.notificationService.url, {
          type: 'admin-invitation',
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
        
        logger.info(`Sent admin invitation to ${invitation.email}`);
      } catch (error) {
        // Log error but don't throw - we don't want initialization to fail if email fails
        logger.error('Error sending admin invitation via notification service:', error.message);
        logger.info(`Please use this registration link: ${registrationLink}`);
      }
    } catch (error) {
      logger.error('Error in sendAdminInvitation:', error);
      // Don't throw - we don't want initialization to fail if email fails
    }
  }

  /**
   * Initialize admin user (check if exists, create invitation if not)
   * @returns {Promise<void>}
   */
  async initializeAdmin() {
    try {
      const adminExists = await this.checkAdminExists();
      
      if (!adminExists) {
        logger.info('No admin user found. Creating admin invitation...');
        const invitation = await this.createAdminInvitation();
        await this.sendAdminInvitation(invitation);
        logger.info('Admin initialization completed. Invitation sent.');
      } else {
        logger.info('Admin user already exists. Skipping initialization.');
      }
    } catch (error) {
      logger.error('Error initializing admin:', error);
      // Don't throw - we don't want server startup to fail if admin initialization fails
    }
  }
}

module.exports = new AdminService();