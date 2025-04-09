const axios = require('axios');
const { asyncHandler, errorTypes } = require('../utils/error-handler');
const appConfig = require('../config/app');
const logger = require('../utils/logger');

/**
 * Get all cancer types
 */
const getAllCancerTypes = asyncHandler(async (req, res) => {
  try {
    const response = await axios.get(`${appConfig.services.storage.url}/api/v1/cancer-types`, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    
    res.status(200).json(response.data);
  } catch (error) {
    logger.error('Error fetching cancer types:', error.message);
    if (error.response) {
      // Forward storage service error
      res.status(error.response.status).json(error.response.data);
    } else {
      throw errorTypes.INTERNAL('Failed to fetch cancer types');
    }
  }
});

/**
 * Get cancer type by ID
 */
const getCancerTypeById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${appConfig.services.storage.url}/api/v1/cancer-types/${id}`, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    
    res.status(200).json(response.data);
  } catch (error) {
    logger.error(`Error fetching cancer type ${req.params.id}:`, error.message);
    if (error.response) {
      // Forward storage service error
      res.status(error.response.status).json(error.response.data);
    } else {
      throw errorTypes.INTERNAL('Failed to fetch cancer type');
    }
  }
});

module.exports = {
  getAllCancerTypes,
  getCancerTypeById
};