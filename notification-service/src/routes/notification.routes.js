const express = require('express');
const {
  sendNotification,
  getNotificationHistory,
  retryFailedNotifications,
  notificationValidation
} = require('../controllers/notification.controller');
const validateApiKey = require('../middlewares/api-key.middleware');

const router = express.Router();

// All routes are protected by API key
router.use(validateApiKey);

/**
 * @route   POST /api/v1/notifications
 * @desc    Send a notification
 * @access  Private (API Key required)
 */
router.post('/', notificationValidation, sendNotification);

/**
 * @route   GET /api/v1/notifications/history/:recipient
 * @desc    Get notification history for a recipient
 * @access  Private (API Key required)
 */
router.get('/history/:recipient', getNotificationHistory);

/**
 * @route   POST /api/v1/notifications/retry
 * @desc    Retry failed notifications
 * @access  Private (API Key required)
 */
router.post('/retry', retryFailedNotifications);

module.exports = router;