import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Creates or overwrites a user profile document in Firestore.
 * Collection: users/{uid}
 *
 * @param {string} uid - Firebase Auth User UID
 * @param {object} profileData - { name, email }
 */
export const createUserProfile = async (uid, profileData) => {
  if (!uid) throw new Error('Cannot create user profile without a valid UID');

  const userRef = doc(db, 'users', uid);
  const now = serverTimestamp();

  const dataToSave = {
    uid,
    name: profileData.name || '',
    email: profileData.email || '',
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(userRef, dataToSave, { merge: true });
  return { ...dataToSave, uid };
};

/**
 * Retrieves a user profile document by UID from Firestore.
 *
 * @param {string} uid - Firebase Auth User UID
 * @returns {Promise<object|null>} The user document or null if not found
 */
export const getUserProfile = async (uid) => {
  if (!uid) return null;

  const userRef = doc(db, 'users', uid);
  const docSnap = await getDoc(userRef);

  if (docSnap.exists()) {
    return { uid, ...docSnap.data() };
  }

  return null;
};

/**
 * Updates an existing user profile document in Firestore.
 *
 * @param {string} uid - Firebase Auth User UID
 * @param {object} updates - Fields to update
 */
export const updateUserProfile = async (uid, updates) => {
  if (!uid) throw new Error('Cannot update user profile without a valid UID');

  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

