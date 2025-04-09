const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { asyncHandler, errorTypes } = require('../utils/error-handler');
const appConfig = require('../config/app');
const logger = require('../utils/logger');

/**
 * Upload files to storage service
 */
const uploadFiles = asyncHandler(async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      throw errorTypes.BAD_REQUEST('No files were uploaded');
    }
    
    // Check files count limit
    const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];
    if (files.length > 10) {
      throw errorTypes.BAD_REQUEST('Maximum 10 files can be uploaded at once');
    }
    
    // Validate required fields
    const { cancerTypeId, reportType, reportId } = req.body;
    if (!cancerTypeId) {
      throw errorTypes.VALIDATION('Cancer type is required');
    }
    if (!reportType || !['new', 'existing'].includes(reportType)) {
      throw errorTypes.VALIDATION('Report type must be either "new" or "existing"');
    }
    if (reportType === 'existing' && !reportId) {
      throw errorTypes.VALIDATION('Report ID is required for existing reports');
    }
    
    // Create form data for storage service
    const formData = new FormData();
    formData.append('cancerTypeId', cancerTypeId);
    formData.append('reportType', reportType);
    if (reportId) {
      formData.append('reportId', reportId);
    }
    formData.append('userId', req.user.id);
    
    // Add files to form data
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      formData.append('files', fs.createReadStream(file.tempFilePath), {
        filename: file.name,
        contentType: file.mimetype
      });
    }
    
    // Send files to storage service (synchronous processing)
    const response = await axios.post(
      `${appConfig.services.storage.url}/api/v1/files/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': req.headers.authorization
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );
    
    // Clean up temp files
    files.forEach(file => {
      fs.unlink(file.tempFilePath, (err) => {
        if (err) logger.error(`Error deleting temp file ${file.tempFilePath}:`, err);
      });
    });
    
    res.status(200).json(response.data);
  } catch (error) {
    // Clean up temp files on error
    if (req.files && req.files.files) {
      const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];
      files.forEach(file => {
        fs.unlink(file.tempFilePath, (err) => {
          if (err) logger.error(`Error deleting temp file ${file.tempFilePath}:`, err);
        });
      });
    }
    
    logger.error('Error uploading files:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else if (error.statusCode) {
      throw error;
    } else {
      throw errorTypes.INTERNAL('Failed to upload files');
    }
  }
});

/**
 * Process files from SFTP
 */
const processSftpFiles = asyncHandler(async (req, res) => {
  try {
    // Validate required fields
    const { cancerTypeId, reportType, reportId, sftpDirectory } = req.body;
    
    if (!cancerTypeId) {
      throw errorTypes.VALIDATION('Cancer type is required');
    }
    if (!reportType || !['new', 'existing'].includes(reportType)) {
      throw errorTypes.VALIDATION('Report type must be either "new" or "existing"');
    }
    if (reportType === 'existing' && !reportId) {
      throw errorTypes.VALIDATION('Report ID is required for existing reports');
    }
    if (!sftpDirectory) {
      throw errorTypes.VALIDATION('SFTP directory is required');
    }
    
    // Send request to storage service (asynchronous processing)
    const response = await axios.post(
      `${appConfig.services.storage.url}/api/v1/files/process-sftp`,
      {
        cancerTypeId,
        reportType,
        reportId,
        sftpDirectory,
        userId: req.user.id
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization
        }
      }
    );
    
    res.status(202).json(response.data);
  } catch (error) {
    logger.error('Error processing SFTP files:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else if (error.statusCode) {
      throw error;
    } else {
      throw errorTypes.INTERNAL('Failed to process SFTP files');
    }
  }
});

/**
 * Get upload/processing status
 */
const getUploadStatus = asyncHandler(async (req, res) => {
  try {
    const { processId } = req.params;
    
    const response = await axios.get(
      `${appConfig.services.storage.url}/api/v1/files/status/${processId}`,
      {
        headers: {
          'Authorization': req.headers.authorization
        }
      }
    );
    
    res.status(200).json(response.data);
  } catch (error) {
    logger.error(`Error getting upload status for ${req.params.processId}:`, error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      throw errorTypes.INTERNAL('Failed to get upload status');
    }
  }
});

/**
 * Get files by report ID
 */
const getFilesByReport = asyncHandler(async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const response = await axios.get(
      `${appConfig.services.storage.url}/api/v1/files/report/${reportId}`,
      {
        headers: {
          'Authorization': req.headers.authorization
        }
      }
    );
    
    res.status(200).json(response.data);
  } catch (error) {
    logger.error(`Error getting files for report ${req.params.reportId}:`, error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      throw errorTypes.INTERNAL('Failed to get report files');
    }
  }
});

module.exports = {
  uploadFiles,
  processSftpFiles,
  getUploadStatus,
  getFilesByReport
};