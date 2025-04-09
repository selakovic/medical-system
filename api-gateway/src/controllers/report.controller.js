const axios = require('axios');
const { asyncHandler, errorTypes } = require('../utils/error-handler');
const appConfig = require('../config/app');
const logger = require('../utils/logger');

/**
 * Get all reports with pagination and filters
 */
const getAllReports = asyncHandler(async (req, res) => {
  try {
    // Forward query parameters
    const response = await axios.get(
      `${appConfig.services.storage.url}/api/v1/reports`,
      {
        params: req.query,
        headers: {
          'Authorization': req.headers.authorization
        }
      }
    );
    
    res.status(200).json(response.data);
  } catch (error) {
    logger.error('Error fetching reports:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      throw errorTypes.INTERNAL('Failed to fetch reports');
    }
  }
});

/**
 * Get report by ID
 */
const getReportById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    const response = await axios.get(
      `${appConfig.services.storage.url}/api/v1/reports/${id}`,
      {
        headers: {
          'Authorization': req.headers.authorization
        }
      }
    );
    
    res.status(200).json(response.data);
  } catch (error) {
    logger.error(`Error fetching report ${req.params.id}:`, error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      throw errorTypes.INTERNAL('Failed to fetch report');
    }
  }
});

/**
 * Download report Excel file
 */
const downloadReport = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get report file from storage service as stream
    const response = await axios.get(
      `${appConfig.services.storage.url}/api/v1/reports/${id}/download`,
      {
        headers: {
          'Authorization': req.headers.authorization
        },
        responseType: 'stream'
      }
    );
    
    // Set content type and disposition headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', response.headers['content-disposition'] || `attachment; filename="report-${id}.xlsx"`);
    
    // Pipe the file stream to response
    response.data.pipe(res);
  } catch (error) {
    logger.error(`Error downloading report ${req.params.id}:`, error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      throw errorTypes.INTERNAL('Failed to download report');
    }
  }
});

module.exports = {
  getAllReports,
  getReportById,
  downloadReport
};