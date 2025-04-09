require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');

// Import configurations and utilities
const appConfig = require('./config/app');
const logger = require('./utils/logger');
const { errorHandler } = require('./utils/error-handler');
const tokenValidationMiddleware = require('./middlewares/token-validation.middleware');

// Import routes
const authProxyRoutes = require('./routes/auth-proxy.routes');
const fileRoutes = require('./routes/file.routes');
const cancerTypeRoutes = require('./routes/cancer-type.routes');
const reportRoutes = require('./routes/report.routes');

// Create the Express application
const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Request logging
const logFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(logFormat, { stream: logger.stream }));

// Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload middleware
app.use(fileUpload({
  createParentPath: true,
  limits: { 
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  },
  abortOnLimit: true,
  useTempFiles: true,
  tempFileDir: path.join(__dirname, '../temp')
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: appConfig.rateLimitWindowMs,
  max: appConfig.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
});
app.use(limiter);

// Public routes
app.use(`${appConfig.apiPrefix}/auth`, authProxyRoutes);

// Protected routes
app.use(`${appConfig.apiPrefix}/cancer-types`, tokenValidationMiddleware, cancerTypeRoutes);
app.use(`${appConfig.apiPrefix}/files`, tokenValidationMiddleware, fileRoutes);
app.use(`${appConfig.apiPrefix}/reports`, tokenValidationMiddleware, reportRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'api-gateway',
    time: new Date()
  });
});

// Error handling middleware
app.use(errorHandler);

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Create necessary directories
const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

/**
 * Start the server
 */
async function startServer() {
  try {
    // Start the server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      logger.info(`API Gateway running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app; 