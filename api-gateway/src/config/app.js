/**
 * Application configuration
 */
module.exports = {
    // Environment
    env: process.env.NODE_ENV || 'development',
    
    // Server port
    port: parseInt(process.env.PORT, 10) || 3000,
    
    // API prefix
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    
    // Microservices URLs
    services: {
      auth: {
        url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001/api/v1'
      },
      storage: {
        url: process.env.STORAGE_SERVICE_URL || 'http://localhost:3003/api/v1'
      },
      notification: {
        url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005/api/v1'
      },
      ai: {
        url: process.env.AI_SERVICE_URL || 'http://localhost:3004/api/v1'
      }
    },
    
    // Request limits
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100 // 100 requests per window
  };