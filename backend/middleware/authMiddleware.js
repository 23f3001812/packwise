const { admin, isFirebaseAdminReady } = require('../config/firebaseAdmin');

/**
 * Middleware to authenticate requests using Firebase ID Tokens.
 * Expects header: "Authorization: Bearer <FIREBASE_ID_TOKEN>"
 */
const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authorization token provided or invalid format. Expected format: Bearer <token>'
    });
  }

  const idToken = authHeader.split('Bearer ')[1].trim();

  if (!isFirebaseAdminReady()) {
    return res.status(503).json({
      success: false,
      message: 'Firebase Admin authentication is not configured on the server yet. Please configure serviceAccountKey.json'
    });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.display_name || '',
      emailVerified: decodedToken.email_verified,
      claims: decodedToken
    };
    return next();
  } catch (error) {
    console.error('[Auth Middleware] Token verification failed:', error.code || error.message);
    
    let message = 'Invalid or expired authentication token.';
    if (error.code === 'auth/id-token-expired') {
      message = 'Authentication token has expired. Please refresh your session.';
    } else if (error.code === 'auth/argument-error') {
      message = 'Malformed authentication token.';
    }

    return res.status(401).json({
      success: false,
      message,
      code: error.code || 'AUTH_ERROR'
    });
  }
};

module.exports = {
  verifyFirebaseToken
};

