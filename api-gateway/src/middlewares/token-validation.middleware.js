const axios = require('axios');
const { errorTypes } = require('../utils/error-handler');
const appConfig = require('../config/app');
const logger = require('../utils/logger');

/**
 * Middleware to validate auth token with auth service
 */
const tokenValidationMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(errorTypes.UNAUTHORIZED('Authentication required'));
    }
    
    const token = authHeader.split(' ')[1];
    
    // Validate token with auth service
    const response = await axios.post(`${appConfig.services.auth.url}/validate-token`, 
      { token },
      { 
        headers: { 
          'Content-Type': 'application/json'
        } 
      }
    );
    
    // Check response
    if (!response.data.success || !response.data.data.valid) {
      return next(errorTypes.UNAUTHORIZED('Invalid or expired token'));
    }
    
    // Attach user info to request
    req.user = {
      id: response.data.data.userId,
      role: response.data.data.role
    };
    
    next();
  } catch (error) {
    logger.error('Token validation error:', error.message);
    if (error.response) {
      // Auth service returned an error
      return next(errorTypes.UNAUTHORIZED('Token validation failed'));
    }
    return next(errorTypes.INTERNAL('Failed to validate authentication'));
  }
};

module.exports = tokenValidationMiddleware;