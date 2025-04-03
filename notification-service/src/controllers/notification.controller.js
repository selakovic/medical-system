const { body, validationResult } = require('express-validator');
const notificationService = require('../services/notification.service');
const { asyncHandler, errorTypes } = require('../utils/error-handler');

/**
 * Notification validation rules
 */
const notificationValidation = [
  body('type').notEmpty().withMessage('Notification type is required'),
  body('recipient').isEmail().withMessage('Valid recipient email is required'),
  body('data').isObject().withMessage('Data must be an object')
];

/**
 * Send notification controller
 */
const sendNotification = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw errorTypes.VALIDATION(errors.array()[0].msg);
  }

  const { type, recipient, data } = req.body;
  const notification = await notificationService.sendNotification(type, recipient, data);

  res.status(200).json({
    success: true,
    message: 'Notification sent successfully',
    data: {
      id: notification.id,
      type: notification.type,
      recipient: notification.recipient,
      status: notification.status,
      sentAt: notification.sentAt
    }
  });
});

/**
 * Get notification history controller
 */
const getNotificationHistory = asyncHandler(async (req, res) => {
  const { recipient } = req.params;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = parseInt(req.query.offset, 10) || 0;
  
  const result = await notificationService.getNotificationHistory(recipient, limit, offset);

  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * Retry failed notifications controller (admin only)
 */
const retryFailedNotifications = asyncHandler(async (req, res) => {
  const maxRetries = parseInt(req.query.maxRetries, 10) || 3;
  const count = await notificationService.retryFailedNotifications(maxRetries);

  res.status(200).json({
    success: true,
    message: `Successfully retried ${count} notifications`,
    data: { count }
  });
});

module.exports = {
  notificationValidation,
  sendNotification,
  getNotificationHistory,
  retryFailedNotifications
};