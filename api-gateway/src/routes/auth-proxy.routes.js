const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const appConfig = require('../config/app');

const router = express.Router();

// Create proxy middleware for auth service
const authServiceProxy = createProxyMiddleware({
  target: appConfig.services.auth.url,
  changeOrigin: true,
  pathRewrite: {
    [`^${appConfig.apiPrefix}/auth`]: '/api/v1/auth' 
  },
  onProxyReq: (proxyReq, req, res) => {
    // Log requests if needed
  },
  onError: (err, req, res) => {
    res.status(500).json({
      success: false,
      message: 'Authentication service unavailable'
    });
  }
});

// Use proxy for all auth routes
router.use('/', authServiceProxy);

module.exports = router;