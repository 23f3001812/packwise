const { getDb, admin } = require('../config/firebaseAdmin');

/**
 * Validates start and end dates.
 * Ensures end date cannot be earlier than start date.
 */
function validateDates(startDate, endDate) {
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format. Expected valid ISO date strings.');
    }
    if (end < start) {
      throw new Error('End date cannot be earlier than start date.');
    }
  }
}

/**
 * Calculates packing and unpacking progress percentages safely.
 */
function calculateProgress(totalItems, packedItems, unpackedItems) {
  const packingProgress = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;
  const unpackingProgress = packedItems > 0 ? Math.round((unpackedItems / packedItems) * 100) : 0;
  const remainingToPack = Math.max(0, totalItems - packedItems);
  const remainingToUnpack = Math.max(0, packedItems - unpackedItems);

  return {
    totalItems,
    packedItems,
    unpackedItems,
    remainingToPack,
    remainingToUnpack,
    packingProgress,
    unpackingProgress
  };
}

/**
 * Creates a new packing list document in Firestore.
 */
async function createPackingList(userId, data) {
  const db = getDb();
  const { eventName, destination, eventType = 'Vacation', description = '', startDate = null, endDate = null } = data;

  if (!eventName || !eventName.trim()) {
    throw new Error('Event or trip name is required.');
  }
  if (!destination || !destination.trim()) {
    throw new Error('Destination is required.');
  }

  validateDates(startDate, endDate);

  const listsRef = db.collection('packingLists');
  const newDocRef = listsRef.doc();
  const listId = newDocRef.id;
  const now = admin.firestore.FieldValue.serverTimestamp();

  const newList = {
    listId,
    userId,
    ownerId: userId,
    memberIds: [userId],
    isCollaborative: false,
    memberCount: 1,
    eventName: eventName.trim(),
    destination: destination.trim(),
    eventType: eventType || 'Vacation',
    description: description ? description.trim() : '',
    startDate: startDate || null,
    endDate: endDate || null,
    mode: 'packing',
    status: 'active',
    createdAt: now,
    updatedAt: now
  };

  await newDocRef.set(newList);

  return {
    ...newList,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Retrieves all packing lists for an authenticated user, enriched with live item stats.
 */
async function getUserPackingLists(userId) {
  const db = getDb();

  // 1. Fetch user lists
  const listsSnapshot = await db
    .collection('packingLists')
    .where('userId', '==', userId)
    .get();

  if (listsSnapshot.empty) {
    return [];
  }

  const lists = [];
  listsSnapshot.forEach((doc) => {
    lists.push({ id: doc.id, ...doc.data() });
  });

  // 2. Fetch all user items to compute aggregate counts per list in memory
  const itemsSnapshot = await db
    .collection('items')
    .where('userId', '==', userId)
    .get();

  const itemCountsByList = {};
  itemsSnapshot.forEach((doc) => {
    const item = doc.data();
    const lId = item.listId;
    if (!itemCountsByList[lId]) {
      itemCountsByList[lId] = { total: 0, packed: 0, unpacked: 0 };
    }
    itemCountsByList[lId].total += 1;
    if (item.isPacked) itemCountsByList[lId].packed += 1;
    if (item.isUnpacked) itemCountsByList[lId].unpacked += 1;
  });

  // 3. Attach progress metrics to each list
  const enrichedLists = lists.map((list) => {
    const counts = itemCountsByList[list.listId] || { total: 0, packed: 0, unpacked: 0 };
    const stats = calculateProgress(counts.total, counts.packed, counts.unpacked);
    return {
      ...list,
      stats
    };
  });

  // Sort by startDate ascending (if available) or createdAt descending
  enrichedLists.sort((a, b) => {
    if (a.startDate && b.startDate) {
      return new Date(a.startDate) - new Date(b.startDate);
    }
    if (a.startDate) return -1;
    if (b.startDate) return 1;
    return 0;
  });

  return enrichedLists;
}

/**
 * Retrieves a single packing list with its associated items and calculated statistics.
 */
async function getPackingListById(userId, listId) {
  const db = getDb();
  const listRef = db.collection('packingLists').doc(listId);
  const listDoc = await listRef.get();

  if (!listDoc.exists) {
    const error = new Error('Packing list not found.');
    error.statusCode = 404;
    throw error;
  }

  const listData = listDoc.data();
  const isOwner = listData.userId === userId || listData.ownerId === userId;
  let isMember = isOwner;
  let myRole = isOwner ? 'owner' : null;

  if (!isOwner) {
    if (Array.isArray(listData.memberIds) && listData.memberIds.includes(userId)) {
      isMember = true;
      myRole = 'editor';
    }
    const memberDoc = await listRef.collection('members').doc(userId).get();
    if (memberDoc.exists && memberDoc.data().status === 'active') {
      isMember = true;
      myRole = memberDoc.data().role || 'editor';
    }
  }

  if (!isMember) {
    const error = new Error('Unauthorized. You do not have access to this packing list.');
    error.statusCode = 403;
    throw error;
  }

  // Fetch items for this list across all members
  const itemsSnapshot = await db
    .collection('items')
    .where('listId', '==', listId)
    .get();

  const items = [];
  let packedCount = 0;
  let unpackedCount = 0;

  itemsSnapshot.forEach((doc) => {
    const item = { itemId: doc.id, ...doc.data() };
    if (item.isPacked) packedCount += 1;
    if (item.isUnpacked) unpackedCount += 1;
    items.push(item);
  });

  // Sort items: high priority first, then by createdAt
  const priorityWeight = { High: 3, Medium: 2, Low: 1 };
  items.sort((a, b) => {
    const pA = priorityWeight[a.priority] || 2;
    const pB = priorityWeight[b.priority] || 2;
    if (pB !== pA) return pB - pA;
    return (a.itemName || '').localeCompare(b.itemName || '');
  });

  const stats = calculateProgress(items.length, packedCount, unpackedCount);

  return {
    list: {
      listId: listDoc.id,
      ...listData,
      isCollaborative: Boolean(listData.isCollaborative),
      isOwner,
      myRole: myRole || 'editor'
    },
    items,
    stats
  };
}

/**
 * Updates a packing list document.
 */
async function updatePackingList(userId, listId, updates) {
  const db = getDb();
  const listRef = db.collection('packingLists').doc(listId);
  const listDoc = await listRef.get();

  if (!listDoc.exists) {
    const error = new Error('Packing list not found.');
    error.statusCode = 404;
    throw error;
  }

  const listData = listDoc.data();
  if (listData.userId !== userId) {
    const error = new Error('Unauthorized. You do not have access to this packing list.');
    error.statusCode = 403;
    throw error;
  }

  const allowedFields = ['eventName', 'destination', 'eventType', 'startDate', 'endDate', 'description', 'mode'];
  const updateData = {};

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      updateData[field] = updates[field];
    }
  }

  // Validate dates if either is updated
  const newStart = updateData.startDate !== undefined ? updateData.startDate : listData.startDate;
  const newEnd = updateData.endDate !== undefined ? updateData.endDate : listData.endDate;
  validateDates(newStart, newEnd);

  // Validate mode if updated
  if (updateData.mode && !['packing', 'unpacking'].includes(updateData.mode)) {
    throw new Error("Invalid list mode. Expected 'packing' or 'unpacking'.");
  }

  updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  await listRef.update(updateData);

  const updatedDoc = await listRef.get();
  return { listId: updatedDoc.id, ...updatedDoc.data() };
}

/**
 * Deletes a packing list and safely cascades deletion to all associated items.
 * Uses batched writes chunked in max 400 operations.
 */
async function deletePackingList(userId, listId) {
  const db = getDb();
  const listRef = db.collection('packingLists').doc(listId);
  const listDoc = await listRef.get();

  if (!listDoc.exists) {
    const error = new Error('Packing list not found.');
    error.statusCode = 404;
    throw error;
  }

  const listData = listDoc.data();
  if (listData.userId !== userId) {
    const error = new Error('Unauthorized. You do not have access to this packing list.');
    error.statusCode = 403;
    throw error;
  }

  // 1. Fetch all items belonging to this list
  const itemsSnapshot = await db
    .collection('items')
    .where('listId', '==', listId)
    .where('userId', '==', userId)
    .get();

  // 2. Perform batched deletion of items in chunks of 400
  const itemDocs = itemsSnapshot.docs;
  const BATCH_SIZE = 400;
  for (let i = 0; i < itemDocs.length; i += BATCH_SIZE) {
    const chunk = itemDocs.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    chunk.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }

  // 3. Delete the packing list document itself
  await listRef.delete();

  return {
    success: true,
    deletedListId: listId,
    deletedItemsCount: itemDocs.length
  };
}

/**
 * Calculates high-level summary metrics for the home dashboard.
 */
async function getDashboardSummary(userId) {
  const db = getDb();

  // Fetch user lists
  const lists = await getUserPackingLists(userId);

  if (lists.length === 0) {
    return {
      hasData: false,
      totalLists: 0,
      totalItems: 0,
      totalPacked: 0,
      remainingItems: 0,
      overallProgress: 0,
      upcomingTrip: null,
      recentLists: []
    };
  }

  let totalItems = 0;
  let totalPacked = 0;

  lists.forEach((list) => {
    if (list.stats) {
      totalItems += list.stats.totalItems;
      totalPacked += list.stats.packedItems;
    }
  });

  const overallProgress = totalItems > 0 ? Math.round((totalPacked / totalItems) * 100) : 0;
  const remainingItems = Math.max(0, totalItems - totalPacked);

  // Find nearest upcoming trip (today or future start date, or first list)
  const todayStr = new Date().toISOString().split('T')[0];
  let upcomingTrip = lists.find((l) => l.startDate && l.startDate >= todayStr);
  if (!upcomingTrip && lists.length > 0) {
    upcomingTrip = lists[0];
  }

  return {
    hasData: true,
    totalLists: lists.length,
    totalItems,
    totalPacked,
    remainingItems,
    overallProgress,
    upcomingTrip,
    recentLists: lists.slice(0, 3)
  };
}

module.exports = {
  createPackingList,
  getUserPackingLists,
  getPackingListById,
  updatePackingList,
  deletePackingList,
  getDashboardSummary
};

