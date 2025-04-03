const { User, Invitation } = require('../models');
const tokenService = require('./token.service');
const logger = require('../utils/logger');
const { errorTypes } = require('../utils/error-handler');

/**
 * Service for authentication
 */
class AuthService {
  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User and tokens
   */
  async login(email, password) {
    try {
      // Find user with password included
      const user = await User.scope('withPassword').findOne({
        where: { email: email.toLowerCase() }
      });
      
      if (!user) {
        throw errorTypes.UNAUTHORIZED('Invalid email or password');
      }
      
      // Check if account is locked
      if (user.isAccountLocked()) {
        const waitTime = Math.ceil((user.lockedUntil - new Date()) / 1000 / 60);
        throw errorTypes.UNAUTHORIZED(`Account is locked. Please try again in ${waitTime} minutes.`);
      }
      
      // Verify password
      const isMatch = await user.comparePassword(password);
      
      if (!isMatch) {
        // Register failed login attempt
        await user.registerFailedLogin();
        throw errorTypes.UNAUTHORIZED('Invalid email or password');
      }
      
      // Reset failed login attempts
      await user.resetFailedLoginAttempts();
      
      // Generate tokens
      const tokens = tokenService.generateTokens(user);
      
      // Return user (without password) and tokens
      return {
        user,
        tokens
      };
    } catch (error) {
      if (error.statusCode) throw error; // Re-throw ApiErrors
      logger.error('Error during login:', error);
      throw errorTypes.INTERNAL('Login failed');
    }
  }

  /**
   * Register a new user from invitation
   * @param {string} token - Invitation token
   * @param {Object} userData - User data
   * @returns {Promise<Object>} User and tokens
   */
  async register(token, userData) {
    try {
      // Find active invitation by token
      const invitation = await Invitation.findActiveByToken(token);
      
      if (!invitation) {
        throw errorTypes.UNAUTHORIZED('Invalid or expired invitation token');
      }
      
      // Verify that email matches invitation
      if (userData.email && userData.email.toLowerCase() !== invitation.email) {
        throw errorTypes.FORBIDDEN('Email does not match invitation');
      }
      
      // Create new user with invitation data
      const user = await User.create({
        email: invitation.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        password: userData.password,
        role: invitation.role,
        isActive: true
      });
      
      // Mark invitation as accepted
      invitation.isAccepted = true;
      invitation.acceptedAt = new Date();
      await invitation.save();
      
      // Generate tokens
      const tokens = tokenService.generateTokens(user);
      
      logger.info(`New user registered: ${user.email}`);
      
      return {
        user,
        tokens
      };
    } catch (error) {
      if (error.statusCode) throw error; // Re-throw ApiErrors
      logger.error('Error during registration:', error);
      throw errorTypes.INTERNAL('Registration failed');
    }
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New tokens
   */
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = tokenService.verifyRefreshToken(refreshToken);
      
      // Get user
      const user = await User.findByPk(decoded.sub);
      
      if (!user) {
        throw errorTypes.UNAUTHORIZED('Invalid token');
      }
      
      // Generate new tokens
      const tokens = tokenService.generateTokens(user);
      
      return tokens;
    } catch (error) {
      if (error.statusCode) throw error; // Re-throw ApiErrors
      logger.error('Error refreshing token:', error);
      throw errorTypes.INTERNAL('Token refresh failed');
    }
  }

  /**
   * Validate invitation token
   * @param {string} token - Invitation token
   * @returns {Promise<Object>} Invitation data
   */
  async validateInvitation(token) {
    try {
      // Find active invitation by token
      const invitation = await Invitation.findActiveByToken(token);
      
      if (!invitation) {
        throw errorTypes.UNAUTHORIZED('Invalid or expired invitation token');
      }
      
      return {
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt
      };
    } catch (error) {
      if (error.statusCode) throw error; // Re-throw ApiErrors
      logger.error('Error validating invitation:', error);
      throw errorTypes.INTERNAL('Invitation validation failed');
    }
  }
}

module.exports = new AuthService();