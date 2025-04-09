const express = require('express');
const { 
  getAllReports,
  getReportById,
  downloadReport
} = require('../controllers/report.controller');

const router = express.Router();

/**
 * @route   GET /api/v1/reports
 * @desc    Get all reports (with pagination and filters)
 * @access  Private
 */
router.get('/', getAllReports);

/**
 * @route   GET /api/v1/reports/:id
 * @desc    Get report by ID
 * @access  Private
 */
router.get('/:id', getReportById);

/**
 * @route   GET /api/v1/reports/:id/download
 * @desc    Download report Excel file
 * @access  Private
 */
router.get('/:id/download', downloadReport);

module.exports = router;