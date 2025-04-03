const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const jwtConfig = require('../config/jwt');
const logger = require('../utils/logger');
const { ApiError, errorTypes } = require('../utils/error-handler');

/**
 * Service for handling JWT tokens
 */
class TokenService {
  /**
   * Generate access token for a user
   * @param {Object} user - User object
   * @returns {String} Access token
   */
  generateAccessToken(user) {
    try {
      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        type: 'access'
      };

      const options = {
        ...jwtConfig.options,
        expiresIn: jwtConfig.accessExpiry
      };

      return jwt.sign(payload, jwtConfig.secret, options);
    } catch (error) {
      logger.error('Error generating access token:', error);
      throw errorTypes.INTERNAL('Token generation failed');
    }
  }

  /**
   * Generate refresh token for a user
   * @param {Object} user - User object
   * @returns {String} Refresh token
   */
  generateRefreshToken(user) {
    try {
      const payload = {
        sub: user.id,
        type: 'refresh',
        jti: uuidv4() // Unique identifier for the token
      };

      const options = {
        ...jwtConfig.options,
        expiresIn: jwtConfig.refreshExpiry
      };

      return jwt.sign(payload, jwtConfig.refreshSecret, options);
    } catch (error) {
      logger.error('Error generating refresh token:', error);
      throw errorTypes.INTERNAL('Token generation failed');
    }
  }

  /**
   * Generate token pair (access + refresh)
   * @param {Object} user - User object
   * @returns {Object} Object containing access and refresh tokens
   */
  generateTokens(user) {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken
    };
  }

  /**
   * Verify access token
   * @param {String} token - JWT token
   * @returns {Object} Decoded token payload
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, jwtConfig.secret, jwtConfig.options);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw errorTypes.UNAUTHORIZED('Access token expired');
      }
      
      if (error.name === 'JsonWebTokenError') {
        throw errorTypes.UNAUTHORIZED('Invalid access token');
      }
      
      logger.error('Error verifying access token:', error);
      throw errorTypes.INTERNAL('Token verification failed');
    }
  }

  /**
   * Verify refresh token
   * @param {String} token - JWT token
   * @returns {Object} Decoded token payload
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, jwtConfig.refreshSecret, jwtConfig.options);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw errorTypes.UNAUTHORIZED('Refresh token expired');
      }
      
      if (error.name === 'JsonWebTokenError') {
        throw errorTypes.UNAUTHORIZED('Invalid refresh token');
      }
      
      logger.error('Error verifying refresh token:', error);
      throw errorTypes.INTERNAL('Token verification failed');
    }
  }
}

module.exports = new TokenService();