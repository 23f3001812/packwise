/**
 * PackWise Notification History & Preferences Service
 * Handles in-app notification center records and user alert preferences.
 */

const { getDb } = require('../config/firebaseAdmin');
const admin = require('firebase-admin');

/**
 * Retrieves in-app notification history for a user.
 */
async function getNotifications(userId) {
  const db = getDb();
  const snap = await db
    .collection('notifications')
    .where('userId', '==', userId)
    .get();

  const notifications = [];
  snap.forEach((doc) => {
    const d = doc.data();
    notifications.push({
      notificationId: doc.id,
      ...d,
      createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt,
    });
  });

  // Sort by createdAt descending
  notifications.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return notifications;
}

/**
 * Creates an in-app notification record.
 */
async function createNotification(userId, data) {
  const db = getDb();
  const { type, title, body, relatedListId, relatedLocationId, missingItems } = data;

  if (!title || !title.trim()) {
    const err = new Error('Notification title is required.');
    err.statusCode = 400;
    throw err;
  }

  const notifRef = db.collection('notifications').doc();
  const notificationId = notifRef.id;
  const now = admin.firestore.FieldValue.serverTimestamp();

  const newNotif = {
    notificationId,
    userId,
    type: type || 'leave_behind',
    title: title.trim(),
    body: body ? body.trim() : '',
    relatedListId: relatedListId || null,
    relatedLocationId: relatedLocationId || null,
    missingItems: Array.isArray(missingItems) ? missingItems : [],
    isRead: false,
    createdAt: now,
  };

  await notifRef.set(newNotif);

  return {
    ...newNotif,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Marks a notification as read.
 */
async function markAsRead(userId, notificationId) {
  const db = getDb();
  const notifRef = db.collection('notifications').doc(notificationId);
  const doc = await notifRef.get();

  if (!doc.exists) {
    const err = new Error('Notification not found.');
    err.statusCode = 404;
    throw err;
  }

  if (doc.data().userId !== userId) {
    const err = new Error('Unauthorized. You do not own this notification.');
    err.statusCode = 403;
    throw err;
  }

  await notifRef.update({ isRead: true });
  return { success: true, notificationId, isRead: true };
}

/**
 * Marks all notifications as read for a user.
 */
async function markAllAsRead(userId) {
  const db = getDb();
  const snap = await db
    .collection('notifications')
    .where('userId', '==', userId)
    .where('isRead', '==', false)
    .get();

  if (snap.empty) {
    return { success: true, updatedCount: 0 };
  }

  const batch = db.batch();
  snap.forEach((doc) => {
    batch.update(doc.ref, { isRead: true });
  });

  await batch.commit();
  return { success: true, updatedCount: snap.size };
}

/**
 * Deletes a single notification.
 */
async function deleteNotification(userId, notificationId) {
  const db = getDb();
  const notifRef = db.collection('notifications').doc(notificationId);
  const doc = await notifRef.get();

  if (!doc.exists) {
    const err = new Error('Notification not found.');
    err.statusCode = 404;
    throw err;
  }

  if (doc.data().userId !== userId) {
    const err = new Error('Unauthorized. You do not own this notification.');
    err.statusCode = 403;
    throw err;
  }

  await notifRef.delete();
  return { success: true, notificationId };
}

/**
 * Clears all notification history for a user.
 */
async function clearAllNotifications(userId) {
  const db = getDb();
  const snap = await db
    .collection('notifications')
    .where('userId', '==', userId)
    .get();

  if (snap.empty) {
    return { success: true, clearedCount: 0 };
  }

  const batch = db.batch();
  snap.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  return { success: true, clearedCount: snap.size };
}

/**
 * Retrieves notification and alert preferences for a user.
 */
async function getUserPreferences(userId) {
  const db = getDb();
  const prefDoc = await db.collection('userPreferences').doc(userId).get();

  const defaultPreferences = {
    leaveBehindAlertsEnabled: true,
    tripRemindersEnabled: true,
    packingRemindersEnabled: true,
    soundEnabled: true,
  };

  if (!prefDoc.exists) {
    return defaultPreferences;
  }

  return {
    ...defaultPreferences,
    ...prefDoc.data(),
  };
}

/**
 * Updates notification and alert preferences for a user.
 */
async function updateUserPreferences(userId, updates) {
  const db = getDb();
  const prefRef = db.collection('userPreferences').doc(userId);

  const payload = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (updates.leaveBehindAlertsEnabled !== undefined) {
    payload.leaveBehindAlertsEnabled = Boolean(updates.leaveBehindAlertsEnabled);
  }
  if (updates.tripRemindersEnabled !== undefined) {
    payload.tripRemindersEnabled = Boolean(updates.tripRemindersEnabled);
  }
  if (updates.packingRemindersEnabled !== undefined) {
    payload.packingRemindersEnabled = Boolean(updates.packingRemindersEnabled);
  }
  if (updates.soundEnabled !== undefined) {
    payload.soundEnabled = Boolean(updates.soundEnabled);
  }

  await prefRef.set(payload, { merge: true });

  const updated = await prefRef.get();
  return updated.data();
}

module.exports = {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getUserPreferences,
  updateUserPreferences,
};

