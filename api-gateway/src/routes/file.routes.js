const express = require('express');
const { 
  uploadFiles, 
  getFilesByReport,
  processSftpFiles,
  getUploadStatus
} = require('../controllers/file.controller');

const router = express.Router();

/**
 * @route   POST /api/v1/files/upload
 * @desc    Upload files (max 10)
 * @access  Private
 */
router.post('/upload', uploadFiles);

/**
 * @route   POST /api/v1/files/process-sftp
 * @desc    Process files from SFTP
 * @access  Private
 */
router.post('/process-sftp', processSftpFiles);

/**
 * @route   GET /api/v1/files/status/:processId
 * @desc    Get upload/processing status
 * @access  Private
 */
router.get('/status/:processId', getUploadStatus);

/**
 * @route   GET /api/v1/files/report/:reportId
 * @desc    Get files by report ID
 * @access  Private
 */
router.get('/report/:reportId', getFilesByReport);

module.exports = router;