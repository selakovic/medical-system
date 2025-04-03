const { User } = require('../models');
const tokenService = require('../services/token.service');
const { errorTypes } = require('../utils/error-handler');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(errorTypes.UNAUTHORIZED('Authentication required'));
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = tokenService.verifyAccessToken(token);
    
    // Check token type
    if (decoded.type !== 'access') {
      return next(errorTypes.UNAUTHORIZED('Invalid token type'));
    }
    
    // Get user from database
    const user = await User.findByPk(decoded.sub);
    
    if (!user) {
      return next(errorTypes.UNAUTHORIZED('User not found'));
    }
    
    // Check if user is active
    if (!user.isActive) {
      return next(errorTypes.UNAUTHORIZED('User account is not active'));
    }
    
    // Attach user to request
    req.user = user;
    
    next();
  } catch (error) {
    // Forward error to error handler
    next(error);
  }
};

/**
 * Authorization middleware for admin-only routes
 * Requires authenticate middleware to be called first
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(errorTypes.FORBIDDEN('Admin access required'));
  }
  
  next();
};

module.exports = {
  authenticate,
  requireAdmin
};