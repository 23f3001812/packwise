/**
 * PackWise Leave-Behind Reminder Service
 * Handles smart leave-behind reminder CRUD and geofence exit evaluation.
 */

const { getDb } = require('../config/firebaseAdmin');
const admin = require('firebase-admin');

/**
 * Validates that the user has access to the specified packing lists (as owner or collaborator).
 */
async function verifyListAccess(db, userId, listIds) {
  if (!Array.isArray(listIds) || listIds.length === 0) {
    const err = new Error('At least one packing list must be selected for the reminder.');
    err.statusCode = 400;
    throw err;
  }

  const validLists = [];
  for (const listId of listIds) {
    const doc = await db.collection('packingLists').doc(listId).get();
    if (!doc.exists) {
      const err = new Error(`Packing list "${listId}" does not exist.`);
      err.statusCode = 400;
      throw err;
    }
    const data = doc.data();
    const isOwner = data.userId === userId || data.ownerId === userId;
    const isMember = Array.isArray(data.memberIds) && data.memberIds.includes(userId);

    if (!isOwner && !isMember) {
      const err = new Error(`Unauthorized. You do not have access to packing list "${data.eventName || listId}".`);
      err.statusCode = 403;
      throw err;
    }

    validLists.push({ listId, eventName: data.eventName || 'Packing List' });
  }

  return validLists;
}

/**
 * Creates a new leave-behind reminder.
 */
async function createReminder(userId, data) {
  const db = getDb();
  const { locationId, packingListIds, itemIds, customMessage, onlyUnpacked, isEnabled } = data;

  if (!locationId || typeof locationId !== 'string' || !locationId.trim()) {
    const err = new Error('A saved location must be selected for this reminder.');
    err.statusCode = 400;
    throw err;
  }

  // 1. Verify location exists and belongs to user
  const locDoc = await db.collection('locations').doc(locationId).get();
  if (!locDoc.exists || locDoc.data().userId !== userId) {
    const err = new Error('Location not found or unauthorized.');
    err.statusCode = 404;
    throw err;
  }
  const locationName = locDoc.data().name || 'Saved Location';

  // 2. Verify list access
  const validLists = await verifyListAccess(db, userId, packingListIds);

  const cleanItemIds = Array.isArray(itemIds) ? itemIds.filter(Boolean) : [];
  const cleanOnlyUnpacked = onlyUnpacked !== undefined ? Boolean(onlyUnpacked) : true;
  const cleanIsEnabled = isEnabled !== undefined ? Boolean(isEnabled) : true;

  const remRef = db.collection('reminders').doc();
  const reminderId = remRef.id;
  const now = admin.firestore.FieldValue.serverTimestamp();

  const newReminder = {
    reminderId,
    userId,
    locationId,
    locationName,
    packingListIds: validLists.map((l) => l.listId),
    packingListNames: validLists.map((l) => l.eventName),
    itemIds: cleanItemIds,
    customMessage: customMessage ? customMessage.trim() : '',
    onlyUnpacked: cleanOnlyUnpacked,
    isEnabled: cleanIsEnabled,
    createdAt: now,
    updatedAt: now,
  };

  await remRef.set(newReminder);

  return {
    ...newReminder,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Retrieves all reminders for a user, enriched with current item status counts.
 */
async function getReminders(userId) {
  const db = getDb();
  const snap = await db
    .collection('reminders')
    .where('userId', '==', userId)
    .get();

  const reminders = [];
  snap.forEach((doc) => {
    const d = doc.data();
    reminders.push({
      reminderId: doc.id,
      ...d,
      createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt,
      updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : d.updatedAt,
    });
  });

  reminders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return reminders;
}

/**
 * Retrieves a single reminder by ID with ownership verification.
 */
async function getReminderById(userId, reminderId) {
  const db = getDb();
  const doc = await db.collection('reminders').doc(reminderId).get();

  if (!doc.exists) {
    const err = new Error('Reminder not found.');
    err.statusCode = 404;
    throw err;
  }

  const d = doc.data();
  if (d.userId !== userId) {
    const err = new Error('Unauthorized. You do not own this reminder.');
    err.statusCode = 403;
    throw err;
  }

  return {
    reminderId: doc.id,
    ...d,
    createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt,
    updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : d.updatedAt,
  };
}

/**
 * Updates an existing reminder.
 */
async function updateReminder(userId, reminderId, updates) {
  const db = getDb();
  const remRef = db.collection('reminders').doc(reminderId);
  const doc = await remRef.get();

  if (!doc.exists) {
    const err = new Error('Reminder not found.');
    err.statusCode = 404;
    throw err;
  }

  if (doc.data().userId !== userId) {
    const err = new Error('Unauthorized. You do not own this reminder.');
    err.statusCode = 403;
    throw err;
  }

  const updatePayload = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (updates.locationId !== undefined) {
    const locDoc = await db.collection('locations').doc(updates.locationId).get();
    if (!locDoc.exists || locDoc.data().userId !== userId) {
      const err = new Error('Target location not found or unauthorized.');
      err.statusCode = 404;
      throw err;
    }
    updatePayload.locationId = updates.locationId;
    updatePayload.locationName = locDoc.data().name || 'Saved Location';
  }

  if (updates.packingListIds !== undefined) {
    const validLists = await verifyListAccess(db, userId, updates.packingListIds);
    updatePayload.packingListIds = validLists.map((l) => l.listId);
    updatePayload.packingListNames = validLists.map((l) => l.eventName);
  }

  if (updates.itemIds !== undefined) {
    updatePayload.itemIds = Array.isArray(updates.itemIds) ? updates.itemIds.filter(Boolean) : [];
  }

  if (updates.customMessage !== undefined) {
    updatePayload.customMessage = updates.customMessage ? updates.customMessage.trim() : '';
  }

  if (updates.onlyUnpacked !== undefined) {
    updatePayload.onlyUnpacked = Boolean(updates.onlyUnpacked);
  }

  if (updates.isEnabled !== undefined) {
    updatePayload.isEnabled = Boolean(updates.isEnabled);
  }

  await remRef.update(updatePayload);

  const updatedDoc = await remRef.get();
  const d = updatedDoc.data();
  return {
    reminderId: updatedDoc.id,
    ...d,
    createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt,
    updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : d.updatedAt,
  };
}

/**
 * Toggles a reminder's enabled status.
 */
async function toggleReminderEnabled(userId, reminderId, isEnabled) {
  return updateReminder(userId, reminderId, { isEnabled });
}

/**
 * Deletes a reminder.
 */
async function deleteReminder(userId, reminderId) {
  const db = getDb();
  const remRef = db.collection('reminders').doc(reminderId);
  const doc = await remRef.get();

  if (!doc.exists) {
    const err = new Error('Reminder not found.');
    err.statusCode = 404;
    throw err;
  }

  if (doc.data().userId !== userId) {
    const err = new Error('Unauthorized. You do not own this reminder.');
    err.statusCode = 403;
    throw err;
  }

  await remRef.delete();
  return { success: true, reminderId };
}

/**
 * Evaluates geofence exit for a user at a given location.
 * Implements the core leave-behind intelligence:
 * 1. Checks if reminders are enabled and location is active.
 * 2. Checks referenced packing lists (verifying access and filtering out deleted lists).
 * 3. Checks selected items:
 *    - If onlyUnpacked is true, filters out items marked isPacked: true.
 *    - If all items are packed, suppresses the notification (no unnecessary alerts!).
 * 4. If unpacked items remain, constructs the notification, logs it in in-app notification history,
 *    and returns the trigger payload.
 */
async function evaluateGeofenceExit(userId, locationId) {
  const db = getDb();

  // 1. Check location
  const locDoc = await db.collection('locations').doc(locationId).get();
  if (!locDoc.exists) {
    return { shouldNotify: false, reason: 'Location not found.' };
  }
  const locData = locDoc.data();
  if (locData.userId !== userId || locData.isActive === false) {
    return { shouldNotify: false, reason: 'Location inactive or not owned by user.' };
  }
  const locationName = locData.name || 'Saved Location';

  // 2. Query enabled reminders for this location and user
  const remindersSnap = await db
    .collection('reminders')
    .where('userId', '==', userId)
    .where('locationId', '==', locationId)
    .where('isEnabled', '==', true)
    .get();

  if (remindersSnap.empty) {
    return { shouldNotify: false, reason: 'No active reminders configured for this location.' };
  }

  const triggeredAlerts = [];

  for (const rDoc of remindersSnap.docs) {
    const reminder = rDoc.data();
    const listIds = reminder.packingListIds || [];
    const specificItemIds = new Set(reminder.itemIds || []);
    const onlyUnpacked = reminder.onlyUnpacked !== false;

    // Fetch items for each list
    let allRelevantItems = [];

    for (const listId of listIds) {
      // Verify list still exists
      const listDoc = await db.collection('packingLists').doc(listId).get();
      if (!listDoc.exists) continue;

      const itemsSnap = await db.collection('items').where('listId', '==', listId).get();
      itemsSnap.forEach((iDoc) => {
        const item = iDoc.data();
        // If reminder specified particular items, filter for them
        if (specificItemIds.size > 0 && !specificItemIds.has(item.itemId)) {
          return;
        }
        allRelevantItems.push(item);
      });
    }

    if (allRelevantItems.length === 0) {
      continue;
    }

    // Filter items based on packing status
    let itemsToAlert = allRelevantItems;
    if (onlyUnpacked) {
      itemsToAlert = allRelevantItems.filter((i) => !i.isPacked);
    }

    // If every item is already packed, do NOT send an alert!
    if (itemsToAlert.length === 0) {
      continue;
    }

    // Build notification content
    const itemNames = itemsToAlert.map((i) => i.itemName);
    const summaryList =
      itemNames.length <= 3
        ? itemNames.join(', ')
        : `${itemNames.slice(0, 3).join(', ')} and ${itemNames.length - 3} more`;

    const title = "Don't forget your belongings!";
    const body = reminder.customMessage
      ? reminder.customMessage
      : `Leaving ${locationName}? Remember to pack ${summaryList}.`;

    // Record notification in in-app history
    const notifRef = db.collection('notifications').doc();
    const notifId = notifRef.id;
    const now = admin.firestore.FieldValue.serverTimestamp();

    const notifDoc = {
      notificationId: notifId,
      userId,
      type: 'leave_behind',
      title,
      body,
      relatedListId: listIds[0] || null,
      relatedLocationId: locationId,
      isRead: false,
      missingItems: itemNames,
      createdAt: now,
    };

    await notifRef.set(notifDoc);

    triggeredAlerts.push({
      reminderId: reminder.reminderId,
      notificationId: notifId,
      title,
      body,
      locationName,
      missingItems: itemNames,
      totalUnpacked: itemNames.length,
      relatedListId: listIds[0] || null,
    });
  }

  if (triggeredAlerts.length === 0) {
    return {
      shouldNotify: false,
      reason: 'All selected items have already been packed.',
    };
  }

  return {
    shouldNotify: true,
    locationName,
    alerts: triggeredAlerts,
  };
}

module.exports = {
  createReminder,
  getReminders,
  getReminderById,
  updateReminder,
  toggleReminderEnabled,
  deleteReminder,
  evaluateGeofenceExit,
};

