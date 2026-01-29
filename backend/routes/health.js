const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'HealthBridge Backend',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API status endpoint
router.get('/status', (req, res) => {
  res.json({
    status: 'operational',
    services: {
      database: 'connected',
      auth: 'active',
      sms: 'configured'
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;