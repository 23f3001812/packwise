const { admin, isFirebaseAdminReady } = require('../config/firebaseAdmin');

/**
 * Public health check controller
 * GET /api/health
 */
const getHealthStatus = (req, res) => {
  const adminReady = isFirebaseAdminReady();

  res.status(200).json({
    success: true,
    message: 'PackWise backend is running',
    timestamp: new Date().toISOString(),
    service: 'packwise-api',
    version: '1.0.0',
    port: req.socket?.localPort || Number(process.env.PORT) || 5001,
    firebaseAdminReady: adminReady
  });
};

/**
 * Protected test endpoint to verify Firebase Auth Token from client
 * GET /api/health/protected
 */
const getProtectedStatus = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authenticated successfully! Token is valid.',
    user: {
      uid: req.user.uid,
      email: req.user.email,
      name: req.user.name
    },
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  getHealthStatus,
  getProtectedStatus
};
