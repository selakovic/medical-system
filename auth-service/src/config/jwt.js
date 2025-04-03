/**
 * JWT configuration
 */
module.exports = {
    // Secret for signing access tokens
    secret: process.env.JWT_SECRET,
    
    // Secret for signing refresh tokens (should be different from access token secret)
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    
    // Access token expiry (short-lived)
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    
    // Refresh token expiry (long-lived)
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    
    // JWT token options
    options: {
      issuer: 'cancer-data-platform',
      audience: 'cancer-data-platform-api'
    }
  };