const { getDb, admin } = require('../config/firebaseAdmin');

const VALID_CONTAINER_TYPES = [
  'Suitcase',
  'Backpack',
  'Handbag',
  'Duffel bag',
  'Storage box',
  'Other'
];

/**
 * Creates a new storage container.
 */
async function createContainer(userId, data) {
  const db = getDb();
  const { containerName, containerType = 'Suitcase', description = '', capacity = null } = data;

  if (!containerName || !containerName.trim()) {
    throw new Error('Container name is required and cannot be blank.');
  }

  if (containerType && !VALID_CONTAINER_TYPES.includes(containerType)) {
    throw new Error(`Invalid container type. Allowed values: ${VALID_CONTAINER_TYPES.join(', ')}`);
  }

  const containersRef = db.collection('containers');
  const newDocRef = containersRef.doc();
  const containerId = newDocRef.id;
  const now = admin.firestore.FieldValue.serverTimestamp();

  const newContainer = {
    containerId,
    userId,
    containerName: containerName.trim(),
    containerType: containerType || 'Suitcase',
    description: description ? description.trim() : '',
    capacity: capacity ? String(capacity).trim() : null,
    createdAt: now,
    updatedAt: now
  };

  await newDocRef.set(newContainer);

  return {
    ...newContainer,
    itemCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Retrieves all storage containers for a user, enriched with assigned item count.
 */
async function getUserContainers(userId) {
  const db = getDb();

  const containersSnapshot = await db
    .collection('containers')
    .where('userId', '==', userId)
    .get();

  if (containersSnapshot.empty) {
    return [];
  }

  // Count assigned items per container
  const itemsSnapshot = await db
    .collection('items')
    .where('userId', '==', userId)
    .get();

  const itemCountsByContainer = {};
  itemsSnapshot.forEach((doc) => {
    const item = doc.data();
    if (item.containerId) {
      itemCountsByContainer[item.containerId] = (itemCountsByContainer[item.containerId] || 0) + 1;
    }
  });

  const containers = [];
  containersSnapshot.forEach((doc) => {
    const data = doc.data();
    containers.push({
      containerId: doc.id,
      ...data,
      itemCount: itemCountsByContainer[doc.id] || 0
    });
  });

  // Sort alphabetically by name
  containers.sort((a, b) => (a.containerName || '').localeCompare(b.containerName || ''));

  return containers;
}

/**
 * Retrieves a single container by ID along with its assigned items.
 */
async function getContainerById(userId, containerId) {
  const db = getDb();
  const containerRef = db.collection('containers').doc(containerId);
  const containerDoc = await containerRef.get();

  if (!containerDoc.exists) {
    const error = new Error('Container not found.');
    error.statusCode = 404;
    throw error;
  }

  const containerData = containerDoc.data();
  if (containerData.userId !== userId) {
    const error = new Error('Unauthorized. You do not have access to this container.');
    error.statusCode = 403;
    throw error;
  }

  // Fetch items in this container
  const items = await getItemsInContainer(userId, containerId);

  return {
    container: {
      containerId: containerDoc.id,
      ...containerData,
      itemCount: items.length
    },
    items
  };
}

/**
 * Updates a container's details.
 */
async function updateContainer(userId, containerId, updates) {
  const db = getDb();
  const containerRef = db.collection('containers').doc(containerId);
  const containerDoc = await containerRef.get();

  if (!containerDoc.exists) {
    const error = new Error('Container not found.');
    error.statusCode = 404;
    throw error;
  }

  const currentData = containerDoc.data();
  if (currentData.userId !== userId) {
    const error = new Error('Unauthorized. You do not have access to this container.');
    error.statusCode = 403;
    throw error;
  }

  const updateData = {};

  if (updates.containerName !== undefined) {
    if (!updates.containerName || !updates.containerName.trim()) {
      throw new Error('Container name cannot be blank.');
    }
    updateData.containerName = updates.containerName.trim();
  }

  if (updates.containerType !== undefined) {
    if (!VALID_CONTAINER_TYPES.includes(updates.containerType)) {
      throw new Error(`Invalid container type. Allowed values: ${VALID_CONTAINER_TYPES.join(', ')}`);
    }
    updateData.containerType = updates.containerType;
  }

  if (updates.description !== undefined) {
    updateData.description = updates.description ? updates.description.trim() : '';
  }

  if (updates.capacity !== undefined) {
    updateData.capacity = updates.capacity ? String(updates.capacity).trim() : null;
  }

  updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  await containerRef.update(updateData);

  const updatedDoc = await containerRef.get();
  return { containerId: updatedDoc.id, ...updatedDoc.data() };
}

/**
 * Deletes a container.
 * Requirement E3: Assigned items must remain intact. Set their containerId to null.
 */
async function deleteContainer(userId, containerId) {
  const db = getDb();
  const containerRef = db.collection('containers').doc(containerId);
  const containerDoc = await containerRef.get();

  if (!containerDoc.exists) {
    const error = new Error('Container not found.');
    error.statusCode = 404;
    throw error;
  }

  if (containerDoc.data().userId !== userId) {
    const error = new Error('Unauthorized. You do not have access to this container.');
    error.statusCode = 403;
    throw error;
  }

  // 1. Find all items assigned to this container
  const itemsSnapshot = await db
    .collection('items')
    .where('containerId', '==', containerId)
    .where('userId', '==', userId)
    .get();

  // 2. Safely unassign containerId (set to null) using batched writes in chunks of 400
  const itemDocs = itemsSnapshot.docs;
  const BATCH_SIZE = 400;
  for (let i = 0; i < itemDocs.length; i += BATCH_SIZE) {
    const chunk = itemDocs.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    chunk.forEach((doc) => {
      batch.update(doc.ref, {
        containerId: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    await batch.commit();
  }

  // 3. Delete the container document itself
  await containerRef.delete();

  return {
    success: true,
    deletedContainerId: containerId,
    unassignedItemsCount: itemDocs.length
  };
}

/**
 * Retrieves all items assigned to a container across all lists for this user,
 * enriched with the name of the packing list they belong to.
 */
async function getItemsInContainer(userId, containerId) {
  const db = getDb();

  // 1. Fetch assigned items
  const itemsSnapshot = await db
    .collection('items')
    .where('containerId', '==', containerId)
    .where('userId', '==', userId)
    .get();

  if (itemsSnapshot.empty) {
    return [];
  }

  // 2. Fetch user's packing lists for eventName lookup
  const listsSnapshot = await db
    .collection('packingLists')
    .where('userId', '==', userId)
    .get();

  const listNames = {};
  listsSnapshot.forEach((doc) => {
    listNames[doc.id] = doc.data().eventName;
  });

  const items = [];
  itemsSnapshot.forEach((doc) => {
    const data = doc.data();
    items.push({
      itemId: doc.id,
      ...data,
      listName: listNames[data.listId] || 'Trip List'
    });
  });

  return items;
}

module.exports = {
  createContainer,
  getUserContainers,
  getContainerById,
  updateContainer,
  deleteContainer,
  getItemsInContainer,
  VALID_CONTAINER_TYPES
};

