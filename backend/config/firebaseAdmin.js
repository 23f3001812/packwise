const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let isInitialized = false;

/**
 * Resolves candidate file paths for the service account key.
 * Handles paths whether running from root, from backend directory, or with an absolute path.
 */
function findServiceAccountPath() {
  const explicitPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const candidatePaths = [];

  if (explicitPath) {
    if (path.isAbsolute(explicitPath)) {
      candidatePaths.push(explicitPath);
    } else {
      candidatePaths.push(path.resolve(process.cwd(), explicitPath));
      candidatePaths.push(path.resolve(__dirname, '..', explicitPath));
      candidatePaths.push(path.resolve(__dirname, explicitPath));
    }
  }

  // Common default locations
  candidatePaths.push(path.join(__dirname, 'serviceAccountKey.json'));
  candidatePaths.push(path.resolve(process.cwd(), 'config', 'serviceAccountKey.json'));
  candidatePaths.push(path.resolve(process.cwd(), 'backend', 'config', 'serviceAccountKey.json'));

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Initializes Firebase Admin SDK with robust credential discovery.
 * Supports:
 * 1. FIREBASE_SERVICE_ACCOUNT_PATH environment variable (pointing to a serviceAccountKey.json)
 * 2. Default local file at backend/config/serviceAccountKey.json
 * 3. FIREBASE_SERVICE_ACCOUNT_KEY environment variable (raw JSON string)
 * 4. Application Default Credentials (ADC) as fallback
 */
function initFirebaseAdmin() {
  // If already initialized and has at least one active app, return existing instance
  if (Array.isArray(admin.apps) && admin.apps.length > 0 && admin.apps[0]) {
    isInitialized = true;
    return admin;
  }

  try {
    const serviceAccountFile = findServiceAccountPath();
    const rawServiceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccountFile) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountFile, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
      isInitialized = true;
      console.log(`[Firebase Admin] Initialized with credentials from: ${serviceAccountFile}`);
    } else if (rawServiceAccountJson) {
      const serviceAccount = JSON.parse(rawServiceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
      isInitialized = true;
      console.log('[Firebase Admin] Initialized with credentials from environment variable');
    } else {
      console.warn(
        '[Firebase Admin] WARNING: No service account credentials found. Token verification will be inactive until credentials are provided. See backend/.env.example for setup instructions.'
      );
      isInitialized = false;
    }
  } catch (error) {
    console.error('[Firebase Admin] Initialization error:', error.message);
    isInitialized = false;
  }

  return admin;
}

// Perform initial initialization
initFirebaseAdmin();

/**
 * Dynamically evaluates whether Firebase Admin is ready to verify tokens.
 * If not yet initialized (e.g., credentials file was added after initial startup),
 * it attempts a re-check to avoid requiring a server restart.
 */
function isFirebaseAdminReady() {
  if (Array.isArray(admin.apps) && admin.apps.length > 0 && admin.apps[0]) {
    return true;
  }

  // Attempt lazy initialization in case credentials were added
  initFirebaseAdmin();

  return Boolean(Array.isArray(admin.apps) && admin.apps.length > 0 && admin.apps[0]);
}

module.exports = {
  admin,
  initFirebaseAdmin,
  isFirebaseAdminReady
};
