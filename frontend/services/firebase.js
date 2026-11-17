import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  // Note: getReactNativePersistence is imported from firebase/auth
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Read Firebase client configuration from Expo public environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Checks if all required Firebase environment variables are defined.
 */
export const isFirebaseConfigured = () => {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== 'YOUR_FIREBASE_API_KEY' &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== 'YOUR_FIREBASE_PROJECT_ID'
  );
};

let app;
let auth;
let db;

try {
  if (getApps().length === 0) {
    // Only initialize with config if configured, or provide a dummy safe config to prevent crash
    app = initializeApp(firebaseConfig.apiKey ? firebaseConfig : {
      apiKey: 'dummy-placeholder-key',
      authDomain: 'dummy.firebaseapp.com',
      projectId: 'dummy-project',
      storageBucket: 'dummy.appspot.com',
      messagingSenderId: '000000000000',
      appId: '1:000000000000:web:0000000000000000000000'
    });
  } else {
    app = getApp();
  }

  // Set up Firebase Auth with AsyncStorage persistence for React Native
  try {
    const { getReactNativePersistence } = require('firebase/auth');
    if (getReactNativePersistence) {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } else {
      auth = getAuth(app);
    }
  } catch (authInitError) {
    // If initializeAuth was already called, getAuth returns the existing auth instance
    auth = getAuth(app);
  }

  db = getFirestore(app);
} catch (error) {
  console.warn('[Firebase Client] Initialization warning:', error.message);
  if (app) {
    auth = getAuth(app);
    db = getFirestore(app);
  }
}

export { app, auth, db };
export default app;

