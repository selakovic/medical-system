require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

// Import configurations and utilities
const { initializeDatabase } = require('./db');
const appConfig = require('./config/app');
const logger = require('./utils/logger');
const { errorHandler } = require('./utils/error-handler');
const emailService = require('./services/email.service');

// Import routes
const notificationRoutes = require('./routes/notification.routes');

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

// Setup API routes
app.use(`${appConfig.apiPrefix}/notifications`, notificationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        service: 'notification-service',
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
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// Create templates directory if it doesn't exist
const templatesDir = path.join(process.cwd(), 'src', 'templates');
if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
}

/**
 * Start the server
 */
async function startServer() {
    try {
        // Initialize database connection
        await initializeDatabase();

        // Verify email service connection
        // try {
        //     await emailService.verifyConnection();
        // } catch (error) {
        //     logger.warn('Email service connection failed, notifications will be stored but not sent', error.message);
        // }
        // Verify email service connection
        try {
            // Privremeno zaobiđemo proveru email servisa
            logger.info('Email service configuration loaded');
        } catch (error) {
            logger.warn('Email service connection failed, notifications will be stored but not sent', error.message);
        }

        // Start the server
        const PORT = process.env.PORT || 3005;
        app.listen(PORT, () => {
            logger.info(`Notification service running on port ${PORT} in ${process.env.NODE_ENV} mode`);
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

module.exports = app; // For testing purposes