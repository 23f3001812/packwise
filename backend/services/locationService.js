/**
 * PackWise Location Service
 * Handles CRUD operations and validation for saved geofenced locations.
 */

const { getDb } = require('../config/firebaseAdmin');
const admin = require('firebase-admin');

const VALID_RADII = [100, 200, 500, 1000];

/**
 * Validates location fields.
 */
function validateLocationData(data) {
  const { name, latitude, longitude, radius } = data;

  if (!name || typeof name !== 'string' || !name.trim()) {
    const err = new Error('Location name is required (e.g. Home, Office, Hotel).');
    err.statusCode = 400;
    throw err;
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  if (isNaN(lat) || lat < -90 || lat > 90) {
    const err = new Error('Valid latitude between -90 and 90 is required.');
    err.statusCode = 400;
    throw err;
  }

  if (isNaN(lng) || lng < -180 || lng > 180) {
    const err = new Error('Valid longitude between -180 and 180 is required.');
    err.statusCode = 400;
    throw err;
  }

  const rad = radius !== undefined ? parseInt(radius, 10) : 200;
  if (isNaN(rad) || rad < 50 || rad > 5000) {
    const err = new Error('Geofence radius must be a number between 50 and 5000 meters.');
    err.statusCode = 400;
    throw err;
  }

  return {
    cleanName: name.trim(),
    cleanLat: lat,
    cleanLng: lng,
    cleanRadius: rad,
  };
}

/**
 * Creates a new saved location for a user.
 */
async function createLocation(userId, data) {
  const db = getDb();
  const { cleanName, cleanLat, cleanLng, cleanRadius } = validateLocationData(data);

  const locRef = db.collection('locations').doc();
  const locationId = locRef.id;
  const now = admin.firestore.FieldValue.serverTimestamp();

  const newLocation = {
    locationId,
    userId,
    name: cleanName,
    address: data.address ? data.address.trim() : '',
    latitude: cleanLat,
    longitude: cleanLng,
    radius: cleanRadius,
    isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
    createdAt: now,
    updatedAt: now,
  };

  await locRef.set(newLocation);

  return {
    ...newLocation,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Retrieves all saved locations for a user.
 */
async function getLocations(userId) {
  const db = getDb();
  const snap = await db
    .collection('locations')
    .where('userId', '==', userId)
    .get();

  const locations = [];
  snap.forEach((doc) => {
    const d = doc.data();
    locations.push({
      locationId: doc.id,
      ...d,
      createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt,
      updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : d.updatedAt,
    });
  });

  // Sort by updatedAt/createdAt descending
  locations.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return locations;
}

/**
 * Retrieves a single location by ID with ownership verification.
 */
async function getLocationById(userId, locationId) {
  const db = getDb();
  const doc = await db.collection('locations').doc(locationId).get();

  if (!doc.exists) {
    const err = new Error('Saved location not found.');
    err.statusCode = 404;
    throw err;
  }

  const d = doc.data();
  if (d.userId !== userId) {
    const err = new Error('Unauthorized. You do not own this location.');
    err.statusCode = 403;
    throw err;
  }

  return {
    locationId: doc.id,
    ...d,
    createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt,
    updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : d.updatedAt,
  };
}

/**
 * Updates a saved location.
 */
async function updateLocation(userId, locationId, updates) {
  const db = getDb();
  const locRef = db.collection('locations').doc(locationId);
  const doc = await locRef.get();

  if (!doc.exists) {
    const err = new Error('Saved location not found.');
    err.statusCode = 404;
    throw err;
  }

  if (doc.data().userId !== userId) {
    const err = new Error('Unauthorized. You do not own this location.');
    err.statusCode = 403;
    throw err;
  }

  const updatePayload = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (updates.name !== undefined) {
    if (!updates.name || typeof updates.name !== 'string' || !updates.name.trim()) {
      const err = new Error('Location name cannot be empty.');
      err.statusCode = 400;
      throw err;
    }
    updatePayload.name = updates.name.trim();
  }

  if (updates.address !== undefined) {
    updatePayload.address = updates.address ? updates.address.trim() : '';
  }

  if (updates.latitude !== undefined) {
    const lat = parseFloat(updates.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      const err = new Error('Valid latitude between -90 and 90 is required.');
      err.statusCode = 400;
      throw err;
    }
    updatePayload.latitude = lat;
  }

  if (updates.longitude !== undefined) {
    const lng = parseFloat(updates.longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      const err = new Error('Valid longitude between -180 and 180 is required.');
      err.statusCode = 400;
      throw err;
    }
    updatePayload.longitude = lng;
  }

  if (updates.radius !== undefined) {
    const rad = parseInt(updates.radius, 10);
    if (isNaN(rad) || rad < 50 || rad > 5000) {
      const err = new Error('Geofence radius must be between 50 and 5000 meters.');
      err.statusCode = 400;
      throw err;
    }
    updatePayload.radius = rad;
  }

  if (updates.isActive !== undefined) {
    updatePayload.isActive = Boolean(updates.isActive);
  }

  await locRef.update(updatePayload);

  const updatedDoc = await locRef.get();
  const d = updatedDoc.data();
  return {
    locationId: updatedDoc.id,
    ...d,
    createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt,
    updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : d.updatedAt,
  };
}

/**
 * Toggles a location's active status.
 */
async function toggleLocationActive(userId, locationId, isActive) {
  return updateLocation(userId, locationId, { isActive });
}

/**
 * Deletes a location and disassociates/cleans up associated reminders.
 */
async function deleteLocation(userId, locationId) {
  const db = getDb();
  const locRef = db.collection('locations').doc(locationId);
  const doc = await locRef.get();

  if (!doc.exists) {
    const err = new Error('Saved location not found.');
    err.statusCode = 404;
    throw err;
  }

  if (doc.data().userId !== userId) {
    const err = new Error('Unauthorized. You do not own this location.');
    err.statusCode = 403;
    throw err;
  }

  const batch = db.batch();
  batch.delete(locRef);

  // Deactivate any reminders associated with this location
  const remindersSnap = await db
    .collection('reminders')
    .where('userId', '==', userId)
    .where('locationId', '==', locationId)
    .get();

  remindersSnap.forEach((rDoc) => {
    batch.update(rDoc.ref, {
      isEnabled: false,
      locationDeleted: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();

  return { success: true, locationId };
}

module.exports = {
  createLocation,
  getLocations,
  getLocationById,
  updateLocation,
  toggleLocationActive,
  deleteLocation,
  VALID_RADII,
};

