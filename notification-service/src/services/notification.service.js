const { Op } = require('sequelize');
const { Notification } = require('../models');
const emailService = require('./email.service');
const emailConfig = require('../config/email');
const logger = require('../utils/logger');
const { errorTypes } = require('../utils/error-handler');

/**
 * Service for handling notifications
 */
class NotificationService {
  /**
   * Create and send notification
   * @param {string} type - Notification type
   * @param {string} recipient - Recipient email
   * @param {Object} data - Template data
   * @returns {Promise<Object>} Created notification
   */
  async sendNotification(type, recipient, data = {}) {
    try {
      // Validate notification type
      if (!this.isValidNotificationType(type)) {
        throw errorTypes.VALIDATION(`Invalid notification type: ${type}`);
      }
      
      // Get template config
      const templateConfig = this.getTemplateConfig(type);
      
      // Create notification record
      const notification = await Notification.create({
        type,
        recipient,
        subject: templateConfig.subject,
        data
      });
      
      // Send email based on notification type - using generic sendEmail for all types
      let result;
      
      // Generički email za sve tipove
      result = await emailService.sendEmail(
        recipient, 
        templateConfig.subject, 
        templateConfig.template, 
        data
      );
      
      // Update notification with sent status
      notification.status = 'sent';
      notification.sentAt = new Date();
      notification.messageId = result.messageId;
      await notification.save();
      
      logger.info(`Notification sent: ${type} to ${recipient}`);
      return notification;
    } catch (error) {
      // If notification record was created, update with error
      if (arguments[3] instanceof Notification) {
        const notification = arguments[3];
        notification.status = 'failed';
        notification.errorMessage = error.message;
        notification.retryCount += 1;
        await notification.save();
      }
      
      if (error.statusCode) throw error; // Re-throw ApiErrors
      logger.error(`Error sending notification:`, error);
      throw errorTypes.INTERNAL('Failed to send notification');
    }
  }

  /**
   * Check if notification type is valid
   * @param {string} type - Notification type
   * @returns {boolean} True if valid
   */
  isValidNotificationType(type) {
    // Valid types are keys in emailConfig.templates or custom types
    return Object.prototype.hasOwnProperty.call(emailConfig.templates, this.normalizeType(type));
  }

  /**
   * Get template configuration for notification type
   * @param {string} type - Notification type
   * @returns {Object} Template configuration
   */
  getTemplateConfig(type) {
    const normalizedType = this.normalizeType(type);
    return emailConfig.templates[normalizedType] || {};
  }

  /**
   * Normalize notification type
   * @param {string} type - Notification type (with or without dashes)
   * @returns {string} Normalized type
   */
  normalizeType(type) {
    // Convert dash-case to camelCase
    return type.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }

  /**
   * Retry failed notifications
   * @param {number} maxRetries - Maximum number of retries
   * @returns {Promise<number>} Number of successfully retried notifications
   */
  async retryFailedNotifications(maxRetries = 3) {
    try {
      // Find failed notifications that haven't exceeded max retries
      const failedNotifications = await Notification.findAll({
        where: {
          status: 'failed',
          retryCount: { [Op.lt]: maxRetries }
        },
        order: [['createdAt', 'ASC']],
        limit: 10 // Process in batches
      });
      
      let successCount = 0;
      
      // Retry each notification
      for (const notification of failedNotifications) {
        try {
          await this.sendNotification(
            notification.type,
            notification.recipient,
            notification.data,
            notification // Pass existing notification for update
          );
          successCount++;
        } catch (error) {
          logger.error(`Failed to retry notification ${notification.id}:`, error);
        }
      }
      
      return successCount;
    } catch (error) {
      logger.error('Error retrying failed notifications:', error);
      return 0;
    }
  }

  /**
   * Get notification history for a recipient
   * @param {string} recipient - Recipient email
   * @param {number} limit - Result limit
   * @param {number} offset - Result offset
   * @returns {Promise<Object>} Notifications with pagination
   */
  async getNotificationHistory(recipient, limit = 10, offset = 0) {
    try {
      const { count, rows } = await Notification.findAndCountAll({
        where: { recipient },
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });
      
      return {
        total: count,
        notifications: rows,
        limit,
        offset
      };
    } catch (error) {
      logger.error('Error getting notification history:', error);
      throw errorTypes.INTERNAL('Failed to get notification history');
    }
  }
}

module.exports = new NotificationService();