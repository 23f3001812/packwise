const express = require('express');
const router = express.Router();
const { getHealthStatus, getProtectedStatus } = require('../controllers/healthController');
const { verifyFirebaseToken } = require('../middleware/authMiddleware');

// Public health check route
router.get('/', getHealthStatus);

// Protected health check route to verify Firebase ID tokens
router.get('/protected', verifyFirebaseToken, getProtectedStatus);

module.exports = router;

