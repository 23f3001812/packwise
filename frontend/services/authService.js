import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';
import { createUserProfile, getUserProfile } from './userService';

/**
 * Friendly error messages for common Firebase Auth error codes.
 */
export const getFriendlyAuthErrorMessage = (error) => {
  if (!error || !error.code) return 'An unexpected error occurred. Please try again.';

  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled in Firebase Console.';
    case 'auth/weak-password':
      return 'The password is too weak. Please use at least 6 characters.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please verify your credentials.';
    case 'auth/too-many-requests':
      return 'Access temporarily blocked due to many failed attempts. Try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    default:
      return error.message || 'Authentication failed. Please check your credentials.';
  }
};

/**
 * Registers a new user with Email and Password, sets displayName, and creates user document in Firestore.
 *
 * @param {string} name - User's full name
 * @param {string} email - User's email
 * @param {string} password - User's password
 */
export const registerUser = async (name, email, password) => {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured. Please set up your .env file with your Firebase credentials.'
    );
  }

  const trimmedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();

  // 1. Create Firebase Auth user
  const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
  const user = userCredential.user;

  // 2. Set Firebase Auth displayName
  if (trimmedName) {
    try {
      await updateProfile(user, { displayName: trimmedName });
    } catch (profileError) {
      console.warn('Failed to update auth displayName:', profileError.message);
    }
  }

  // 3. Create Firestore user document
  try {
    await createUserProfile(user.uid, {
      name: trimmedName,
      email: trimmedEmail,
    });
  } catch (firestoreError) {
    console.error('Failed to create Firestore profile document:', firestoreError);
    // Don't fail the registration completely if Firestore rules block or fails, but log it
  }

  return user;
};

/**
 * Signs in an existing user with Email and Password.
 *
 * @param {string} email - User's email
 * @param {string} password - User's password
 */
export const loginUser = async (email, password) => {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured. Please set up your .env file with your Firebase credentials.'
    );
  }

  const trimmedEmail = email.trim().toLowerCase();
  const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
  return userCredential.user;
};

/**
 * Signs out the current user.
 */
export const logoutUser = async () => {
  await firebaseSignOut(auth);
};

/**
 * Retrieves the current Firebase ID Token for authenticating backend requests.
 */
export const getCurrentIdToken = async (forceRefresh = false) => {
  if (!auth.currentUser) return null;
  return await auth.currentUser.getIdToken(forceRefresh);
};

