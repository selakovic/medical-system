const appConfig = require('../config/app');
const { errorTypes } = require('../utils/error-handler');

/**
 * Middleware to validate API key
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== appConfig.apiKey) {
    return next(errorTypes.UNAUTHORIZED('Invalid API key'));
  }
  
  next();
};

module.exports = validateApiKey;