/**
 * Application configuration
 */
module.exports = {
    // Environment
    env: process.env.NODE_ENV || 'development',
    
    // Server port
    port: parseInt(process.env.PORT, 10) || 3001,
    
    // API prefix
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    
    // Request limits
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // 100 requests per window
    
    // Notification service
    notificationService: {
      url: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3005/api/v1/notifications',
      apiKey: process.env.NOTIFICATION_SERVICE_API_KEY
    },
    
    // Frontend URLs (for redirects after registration)
    frontendUrls: {
      base: process.env.FRONTEND_URL || 'http://localhost:3000',
      login: process.env.FRONTEND_LOGIN_URL || 'http://localhost:3000/login',
      registrationSuccess: process.env.FRONTEND_REGISTRATION_SUCCESS_URL || 'http://localhost:3000/registration-success'
    }
  };