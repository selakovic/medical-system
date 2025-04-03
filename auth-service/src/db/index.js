/**
 * Sequelize database connection
 */
const { Sequelize } = require('sequelize');
const config = require('../config/database');
const logger = require('../utils/logger');

// Get the environment configuration
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Create a Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging ? msg => logger.debug(msg) : false,
    pool: dbConfig.pool,
    dialectOptions: dbConfig.dialectOptions
  }
);

/**
 * Initialize database connection
 */
async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    logger.info(`Connected to PostgreSQL database: ${dbConfig.database}`);
    
    // Handle application termination
    process.on('SIGINT', async () => {
      await sequelize.close();
      logger.info('Database connection closed due to application termination');
      process.exit(0);
    });
    
    return sequelize;
  } catch (error) {
    logger.error(`Error connecting to PostgreSQL database: ${error.message}`);
    throw error;
  }
}

module.exports = {
  sequelize,
  initializeDatabase
};