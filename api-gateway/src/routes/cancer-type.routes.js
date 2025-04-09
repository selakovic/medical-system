const express = require('express');
const { 
  getAllCancerTypes,
  getCancerTypeById
} = require('../controllers/cancer-type.controller');

const router = express.Router();

/**
 * @route   GET /api/v1/cancer-types
 * @desc    Get all cancer types
 * @access  Private
 */
router.get('/', getAllCancerTypes);

/**
 * @route   GET /api/v1/cancer-types/:id
 * @desc    Get cancer type by ID
 * @access  Private
 */
router.get('/:id', getCancerTypeById);

module.exports = router;