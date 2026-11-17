const { getDb, admin } = require('../config/firebaseAdmin');

const VALID_CATEGORIES = [
  'Clothing',
  'Footwear',
  'Toiletries',
  'Electronics',
  'Documents',
  'Medicines',
  'Accessories',
  'Travel essentials',
  'Food',
  'Other'
];

const VALID_PRIORITIES = ['Low', 'Medium', 'High'];

/**
 * Validates item attributes.
 */
function validateItemFields({ itemName, quantity, category, priority }) {
  if (!itemName || !itemName.trim()) {
    throw new Error('Item name is required and cannot be blank.');
  }

  const parsedQty = parseInt(quantity, 10);
  if (isNaN(parsedQty) || parsedQty <= 0) {
    throw new Error('Quantity must be a positive integer greater than zero.');
  }

  if (category && !VALID_CATEGORIES.includes(category)) {
    throw new Error(`Invalid category. Allowed values: ${VALID_CATEGORIES.join(', ')}`);
  }

  if (priority && !VALID_PRIORITIES.includes(priority)) {
    throw new Error(`Invalid priority. Allowed values: ${VALID_PRIORITIES.join(', ')}`);
  }

  return parsedQty;
}

/**
 * Verifies that the specified container exists and is owned by the user.
 */
async function verifyContainerOwnership(db, userId, containerId) {
  if (!containerId) return null;
  const containerDoc = await db.collection('containers').doc(containerId).get();
  if (!containerDoc.exists || containerDoc.data().userId !== userId) {
    throw new Error('Assigned container not found or unauthorized.');
  }
  return containerDoc.data().containerName;
}

/**
 * Verifies that the user has permission to read or modify items in a packing list.
 * Roles: 'owner' and 'editor' can modify items; 'viewer' has read-only access.
 */
async function verifyItemPermission(db, userId, listId, requiredRole = 'editor') {
  const listRef = db.collection('packingLists').doc(listId);
  const listDoc = await listRef.get();

  if (!listDoc.exists) {
    const error = new Error('Packing list not found.');
    error.statusCode = 404;
    throw error;
  }

  const listData = listDoc.data();
  const isOwner = listData.userId === userId || listData.ownerId === userId;
  if (isOwner) {
    return { role: 'owner', isOwner: true, listData };
  }

  let isMember = false;
  let userRole = 'viewer';

  const memberDoc = await listRef.collection('members').doc(userId).get();
  if (memberDoc.exists && memberDoc.data().status === 'active') {
    isMember = true;
    userRole = memberDoc.data().role || 'editor';
  } else if (Array.isArray(listData.memberIds) && listData.memberIds.includes(userId)) {
    isMember = true;
    userRole = 'editor';
  }

  if (!isMember) {
    const error = new Error('Unauthorized. You do not have access to this packing list.');
    error.statusCode = 403;
    throw error;
  }

  if (requiredRole === 'editor' && userRole === 'viewer') {
    const error = new Error('Viewers have read-only access and cannot modify items on this list.');
    error.statusCode = 403;
    throw error;
  }

  return { role: userRole, isOwner: false, listData };
}

/**
 * Adds a new item to a packing list.
 */
async function addItemToList(userId, listId, itemData) {
  const db = getDb();

  // 1. Verify list exists and caller has editor/owner permissions
  await verifyItemPermission(db, userId, listId, 'editor');

  // 2. Validate fields
  const validQty = validateItemFields(itemData);
  const category = itemData.category || 'Other';
  const priority = itemData.priority || 'Medium';
  const containerId = itemData.containerId || null;

  // 3. Verify container if provided
  let containerName = null;
  if (containerId) {
    containerName = await verifyContainerOwnership(db, userId, containerId);
  }

  const itemsRef = db.collection('items');
  const newDocRef = itemsRef.doc();
  const itemId = newDocRef.id;
  const now = admin.firestore.FieldValue.serverTimestamp();

  // Resolve author name if not explicitly provided
  let authorName = itemData.createdByName || '';
  if (!authorName) {
    try {
      const uSnap = await db.collection('users').doc(userId).get();
      if (uSnap.exists) {
        authorName = uSnap.data().displayName || uSnap.data().name || '';
      }
    } catch (_) {}
  }

  const newItem = {
    itemId,
    userId,
    listId,
    itemName: itemData.itemName.trim(),
    category,
    quantity: validQty,
    notes: itemData.notes ? itemData.notes.trim() : '',
    priority,
    isPacked: false,
    isUnpacked: false,
    containerId,
    createdBy: userId,
    createdByName: authorName,
    updatedBy: userId,
    updatedByName: authorName,
    createdAt: now,
    updatedAt: now
  };

  await newDocRef.set(newItem);

  return {
    ...newItem,
    containerName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Retrieves all items for a packing list, enriched with container names.
 */
async function getItemsByList(userId, listId) {
  const db = getDb();

  // 1. Verify list ownership
  const listDoc = await db.collection('packingLists').doc(listId).get();
  if (!listDoc.exists || listDoc.data().userId !== userId) {
    const error = new Error('Packing list not found or unauthorized.');
    error.statusCode = 404;
    throw error;
  }

  // 2. Fetch items
  const itemsSnapshot = await db
    .collection('items')
    .where('listId', '==', listId)
    .where('userId', '==', userId)
    .get();

  // 3. Fetch user containers map for name enrichment
  const containersSnapshot = await db
    .collection('containers')
    .where('userId', '==', userId)
    .get();

  const containerNames = {};
  containersSnapshot.forEach((doc) => {
    containerNames[doc.id] = doc.data().containerName;
  });

  const items = [];
  itemsSnapshot.forEach((doc) => {
    const data = doc.data();
    items.push({
      itemId: doc.id,
      ...data,
      containerName: data.containerId ? containerNames[data.containerId] || 'Assigned Bag' : null
    });
  });

  return items;
}

/**
 * Retrieves a single item by ID.
 */
async function getItemById(userId, itemId) {
  const db = getDb();
  const itemDoc = await db.collection('items').doc(itemId).get();

  if (!itemDoc.exists) {
    const error = new Error('Item not found.');
    error.statusCode = 404;
    throw error;
  }

  const data = itemDoc.data();
  if (data.userId !== userId) {
    const error = new Error('Unauthorized. You do not have access to this item.');
    error.statusCode = 403;
    throw error;
  }

  let containerName = null;
  if (data.containerId) {
    const containerDoc = await db.collection('containers').doc(data.containerId).get();
    if (containerDoc.exists) {
      containerName = containerDoc.data().containerName;
    }
  }

  return {
    itemId: itemDoc.id,
    ...data,
    containerName
  };
}

/**
 * Updates an item's details (name, quantity, category, priority, notes, container).
 */
async function updateItem(userId, itemId, updates) {
  const db = getDb();
  const itemRef = db.collection('items').doc(itemId);
  const itemDoc = await itemRef.get();

  if (!itemDoc.exists) {
    const error = new Error('Item not found.');
    error.statusCode = 404;
    throw error;
  }

  const currentData = itemDoc.data();
  // Verify user has editor or owner permissions on the packing list
  await verifyItemPermission(db, userId, currentData.listId, 'editor');

  const updateData = {};

  if (updates.itemName !== undefined) {
    if (!updates.itemName || !updates.itemName.trim()) {
      throw new Error('Item name cannot be blank.');
    }
    updateData.itemName = updates.itemName.trim();
  }

  if (updates.quantity !== undefined) {
    const parsedQty = parseInt(updates.quantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      throw new Error('Quantity must be a positive integer greater than zero.');
    }
    updateData.quantity = parsedQty;
  }

  if (updates.category !== undefined) {
    if (!VALID_CATEGORIES.includes(updates.category)) {
      throw new Error(`Invalid category. Allowed values: ${VALID_CATEGORIES.join(', ')}`);
    }
    updateData.category = updates.category;
  }

  if (updates.priority !== undefined) {
    if (!VALID_PRIORITIES.includes(updates.priority)) {
      throw new Error(`Invalid priority. Allowed values: ${VALID_PRIORITIES.join(', ')}`);
    }
    updateData.priority = updates.priority;
  }

  if (updates.notes !== undefined) {
    updateData.notes = updates.notes ? updates.notes.trim() : '';
  }

  if (updates.containerId !== undefined) {
    if (updates.containerId) {
      await verifyContainerOwnership(db, userId, updates.containerId);
      updateData.containerId = updates.containerId;
    } else {
      updateData.containerId = null;
    }
  }

  updateData.updatedBy = userId;
  if (updates.updatedByName) {
    updateData.updatedByName = updates.updatedByName;
  }
  updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  await itemRef.update(updateData);

  const updatedDoc = await itemRef.get();
  return { itemId: updatedDoc.id, ...updatedDoc.data() };
}

/**
 * Updates an item's packed and unpacked statuses with validation.
 * Rule: An item cannot be marked unpacked if it was never marked packed.
 * Rule: Unmarking packed resets isUnpacked to false.
 */
async function updateItemStatus(userId, itemId, { isPacked, isUnpacked, updatedByName }) {
  const db = getDb();
  const itemRef = db.collection('items').doc(itemId);
  const itemDoc = await itemRef.get();

  if (!itemDoc.exists) {
    const error = new Error('Item not found.');
    error.statusCode = 404;
    throw error;
  }

  const currentData = itemDoc.data();
  // Verify user has editor or owner permissions on the packing list
  await verifyItemPermission(db, userId, currentData.listId, 'editor');

  let finalPacked = currentData.isPacked;
  let finalUnpacked = currentData.isUnpacked;

  if (typeof isPacked === 'boolean') {
    finalPacked = isPacked;
    // If user marks packed as false, reset unpacked to false
    if (!finalPacked) {
      finalUnpacked = false;
    }
  }

  if (typeof isUnpacked === 'boolean') {
    // Prevent marking unpacked if not packed
    if (isUnpacked && !finalPacked) {
      throw new Error('An item cannot be marked unpacked if it was never marked packed.');
    }
    finalUnpacked = isUnpacked;
  }

  // Resolve updater name if not provided
  let updaterName = updatedByName || '';
  if (!updaterName) {
    try {
      const uSnap = await db.collection('users').doc(userId).get();
      if (uSnap.exists) {
        updaterName = uSnap.data().displayName || uSnap.data().name || '';
      }
    } catch (_) {}
  }

  const updateData = {
    isPacked: finalPacked,
    isUnpacked: finalUnpacked,
    updatedBy: userId,
    updatedByName: updaterName,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await itemRef.update(updateData);

  return {
    itemId,
    isPacked: finalPacked,
    isUnpacked: finalUnpacked,
    updatedBy: userId,
    updatedByName: updaterName
  };
}

/**
 * Deletes an item.
 */
async function deleteItem(userId, itemId) {
  const db = getDb();
  const itemRef = db.collection('items').doc(itemId);
  const itemDoc = await itemRef.get();

  if (!itemDoc.exists) {
    const error = new Error('Item not found.');
    error.statusCode = 404;
    throw error;
  }

  const currentData = itemDoc.data();
  // Verify user has editor or owner permissions on the packing list
  await verifyItemPermission(db, userId, currentData.listId, 'editor');

  await itemRef.delete();

  return {
    success: true,
    deletedItemId: itemId
  };
}

/**
 * Batch adds multiple items to a packing list using a Firestore write batch.
 *
 * @param {string} userId - Authenticated user ID
 * @param {string} listId - Target packing list ID
 * @param {Array<object>} itemsArray - Array of item objects
 * @returns {Promise<object>} Created items count and details
 */
async function batchAddItemsToList(userId, listId, itemsArray) {
  const db = getDb();

  // 1. Verify list exists and caller has editor/owner permissions
  await verifyItemPermission(db, userId, listId, 'editor');

  if (!Array.isArray(itemsArray) || itemsArray.length === 0) {
    const error = new Error('Items array is required and must not be empty.');
    error.statusCode = 400;
    throw error;
  }

  if (itemsArray.length > 50) {
    const error = new Error('Cannot add more than 50 items in a single batch.');
    error.statusCode = 400;
    throw error;
  }

  const batch = db.batch();
  const itemsRef = db.collection('items');
  const now = admin.firestore.FieldValue.serverTimestamp();
  const createdItems = [];

  for (const itemData of itemsArray) {
    const itemName = itemData.itemName || itemData.name;
    if (!itemName || !String(itemName).trim()) continue;

    const parsedQty = Math.max(1, parseInt(itemData.quantity, 10) || 1);
    const category = itemData.category && VALID_CATEGORIES.includes(itemData.category)
      ? itemData.category
      : 'Other';
    const priority = itemData.priority && VALID_PRIORITIES.includes(itemData.priority)
      ? itemData.priority
      : 'Medium';
    const containerId = itemData.containerId || null;
    const notes = itemData.notes || itemData.reason || '';

    const newDocRef = itemsRef.doc();
    const itemId = newDocRef.id;

    const newItem = {
      itemId,
      userId,
      listId,
      itemName: String(itemName).trim(),
      category,
      quantity: parsedQty,
      notes: String(notes).trim(),
      priority,
      isPacked: false,
      isUnpacked: false,
      containerId,
      createdAt: now,
      updatedAt: now
    };

    batch.set(newDocRef, newItem);
    createdItems.push({ ...newItem, itemId });
  }

  if (createdItems.length === 0) {
    const error = new Error('No valid items found to add in batch.');
    error.statusCode = 400;
    throw error;
  }

  // Update packing list's updatedAt
  const listRef = db.collection('packingLists').doc(listId);
  batch.update(listRef, {
    updatedAt: now
  });

  await batch.commit();

  return {
    success: true,
    count: createdItems.length,
    items: createdItems
  };
}

module.exports = {
  addItemToList,
  batchAddItemsToList,
  getItemsByList,
  getItemById,
  updateItem,
  updateItemStatus,
  deleteItem,
  VALID_CATEGORIES,
  VALID_PRIORITIES
};

