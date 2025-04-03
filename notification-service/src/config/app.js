/**
 * Application configuration
 */
module.exports = {
    // Environment
    env: process.env.NODE_ENV || 'development',
    
    // Server port
    port: parseInt(process.env.PORT, 10) || 3005,
    
    // API prefix
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    
    // API security
    apiKey: process.env.API_KEY,
    
    // Request limits
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // 100 requests per window
    
    // Frontend URLs
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
  };