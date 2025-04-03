/**
 * Custom error class for API errors
 */
class ApiError extends Error {
    constructor(statusCode, message, isOperational = true, stack = '') {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = isOperational;
      
      if (stack) {
        this.stack = stack;
      } else {
        Error.captureStackTrace(this, this.constructor);
      }
    }
  }
  
  /**
   * Factory for creating specific API errors
   */
  const errorTypes = {
    BAD_REQUEST: (message = 'Bad request') => new ApiError(400, message),
    UNAUTHORIZED: (message = 'Unauthorized') => new ApiError(401, message),
    FORBIDDEN: (message = 'Forbidden') => new ApiError(403, message),
    NOT_FOUND: (message = 'Resource not found') => new ApiError(404, message),
    CONFLICT: (message = 'Resource conflict') => new ApiError(409, message),
    VALIDATION: (message = 'Validation error') => new ApiError(422, message),
    INTERNAL: (message = 'Internal server error') => new ApiError(500, message, false)
  };
  
  /**
   * Async error handler (for route handlers)
   * Eliminates the need for try/catch blocks in route handlers
   */
  const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
  
  /**
   * Convert Sequelize validation errors to ApiError
   */
  const convertSequelizeError = (err) => {
    // Handle Sequelize validation errors
    if (err.name === 'SequelizeValidationError') {
      const messages = err.errors.map(e => e.message);
      return errorTypes.VALIDATION(messages.join(', '));
    }
    
    // Handle unique constraint errors
    if (err.name === 'SequelizeUniqueConstraintError') {
      const field = err.errors[0].path;
      return errorTypes.CONFLICT(`A record with this ${field} already exists`);
    }
    
    // Handle foreign key constraint errors
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      return errorTypes.VALIDATION('Invalid reference to a related record');
    }
    
    return null;
  };
  
  /**
   * Global error handler middleware
   */
  const errorHandler = (err, req, res, next) => {
    // Convert Sequelize errors to ApiError
    const sequelizeError = convertSequelizeError(err);
    const error = sequelizeError || err;
    
    // Default to 500 if status code is not set
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Something went wrong';
    
    const response = {
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    };
    
    res.status(statusCode).json(response);
  };
  
  module.exports = {
    ApiError,
    errorTypes,
    asyncHandler,
    errorHandler
  };