/**
 * PackWise Milestone 5 Automated Verification Test Suite
 * Tests Location Management, Geofence Validation, Smart Leave-Behind Alerts,
 * Item Status Filtering (onlyUnpacked), In-App Notification Center, and Route Guards.
 */

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const { getDb } = require('../config/firebaseAdmin');
const locationService = require('../services/locationService');
const reminderService = require('../services/reminderService');
const notificationHistoryService = require('../services/notificationHistoryService');
const listService = require('../services/listService');
const itemService = require('../services/itemService');

async function runMilestone5Tests() {
  console.log('=======================================================');
  console.log('🧪 PACKWISE MILESTONE 5 VERIFICATION TEST SUITE');
  console.log('=======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  const db = getDb();
  const timestamp = Date.now();
  const testUserId = `test_m5_user_${timestamp}`;
  const otherUserId = `test_m5_other_${timestamp}`;

  let testLocationId = null;
  let testListId = null;
  let testItemId1 = null;
  let testItemId2 = null;
  let testReminderId = null;

  try {
    // 0. Setup Test User Profiles in Firestore
    console.log('--- 0. Setup Test Users in Firestore ---');
    await db.collection('users').doc(testUserId).set({
      userId: testUserId,
      email: `m5_${timestamp}@packwise.test`,
      displayName: 'Prachi M5',
      createdAt: new Date(),
    });
    await db.collection('users').doc(otherUserId).set({
      userId: otherUserId,
      email: `other_${timestamp}@packwise.test`,
      displayName: 'Other M5',
      createdAt: new Date(),
    });
    assert(true, 'Created test user profiles in Firestore');

    // 1. Location Validation
    console.log('\n--- 1. Testing Location Validation ---');
    try {
      await locationService.createLocation(testUserId, {
        name: '',
        latitude: 19.076,
        longitude: 72.8777,
      });
      assert(false, 'Empty location name should throw error');
    } catch (err) {
      assert(err.message.includes('Location name is required'), 'Rejects empty location name');
    }

    try {
      await locationService.createLocation(testUserId, {
        name: 'Invalid Lat',
        latitude: 95.0, // > 90
        longitude: 72.8777,
      });
      assert(false, 'Latitude > 90 should throw error');
    } catch (err) {
      assert(err.message.includes('Valid latitude'), 'Rejects out-of-range latitude');
    }

    try {
      await locationService.createLocation(testUserId, {
        name: 'Invalid Lng',
        latitude: 19.076,
        longitude: 195.0, // > 180
      });
      assert(false, 'Longitude > 180 should throw error');
    } catch (err) {
      assert(err.message.includes('Valid longitude'), 'Rejects out-of-range longitude');
    }

    try {
      await locationService.createLocation(testUserId, {
        name: 'Invalid Radius',
        latitude: 19.076,
        longitude: 72.8777,
        radius: 10, // < 50
      });
      assert(false, 'Radius < 50 should throw error');
    } catch (err) {
      assert(err.message.includes('Geofence radius'), 'Rejects out-of-range radius');
    }

    // 2. Location CRUD Operations
    console.log('\n--- 2. Testing Location CRUD Operations ---');
    const createdLocation = await locationService.createLocation(testUserId, {
      name: 'Home Apartment',
      address: '101 Marine Drive, Mumbai',
      latitude: 18.9438,
      longitude: 72.8232,
      radius: 200,
      isActive: true,
    });
    testLocationId = createdLocation.locationId;
    assert(testLocationId, `Created location with ID: ${testLocationId}`);
    assert(createdLocation.radius === 200, 'Radius defaulted/saved as 200m');
    assert(createdLocation.isActive === true, 'Initial status isActive: true');

    // Get location by ID
    const fetchedLocation = await locationService.getLocationById(testUserId, testLocationId);
    assert(fetchedLocation.name === 'Home Apartment', 'Fetched location matches name');

    // Update location
    const updatedLocation = await locationService.updateLocation(testUserId, testLocationId, {
      name: 'Home Sweet Home',
      radius: 500,
    });
    assert(updatedLocation.name === 'Home Sweet Home', 'Updated location name successfully');
    assert(updatedLocation.radius === 500, 'Updated location radius to 500m');

    // Toggle active
    const toggledLocation = await locationService.toggleLocationActive(testUserId, testLocationId, false);
    assert(toggledLocation.isActive === false, 'Toggled location isActive: false');
    await locationService.toggleLocationActive(testUserId, testLocationId, true);

    // List locations for user
    const userLocations = await locationService.getLocations(testUserId);
    assert(
      Array.isArray(userLocations) && userLocations.some((l) => l.locationId === testLocationId),
      'Locations list includes newly created location'
    );

    // 3. Setup Test Packing List and Items for Leave-Behind Tests
    console.log('\n--- 3. Setup Packing List & Items for Leave-Behind Tests ---');
    const listRes = await listService.createPackingList(testUserId, {
      eventName: 'Office Commute',
      destination: 'Tech Park, Mumbai',
      eventType: 'Business',
      startDate: '2026-12-10',
    });
    testListId = listRes.listId;

    const item1 = await itemService.addItemToList(testUserId, testListId, {
      itemName: 'MacBook Pro',
      category: 'Electronics',
      quantity: 1,
      priority: 'High',
    });
    testItemId1 = item1.itemId;

    const item2 = await itemService.addItemToList(testUserId, testListId, {
      itemName: 'Office Access Card',
      category: 'Documents',
      quantity: 1,
      priority: 'High',
    });
    testItemId2 = item2.itemId;

    assert(testItemId1 && testItemId2, 'Created test items: MacBook Pro and Office Access Card');

    // 4. Leave-Behind Reminder Creation & Validation
    console.log('\n--- 4. Testing Leave-Behind Reminder Creation ---');
    // Attempt with other user's list -> BLOCKED
    try {
      await reminderService.createReminder(otherUserId, {
        locationId: testLocationId,
        packingListIds: [testListId],
      });
      assert(false, 'Reminder creation with unauthorized list should throw error');
    } catch (err) {
      assert(err.statusCode === 404 || err.statusCode === 403, 'Blocked unauthorized list reference');
    }

    // Create valid reminder
    const reminderRes = await reminderService.createReminder(testUserId, {
      locationId: testLocationId,
      packingListIds: [testListId],
      itemIds: [testItemId1, testItemId2],
      customMessage: "Leaving Home? Don't forget your MacBook Pro & Office Access Card!",
      onlyUnpacked: true,
      isEnabled: true,
    });
    testReminderId = reminderRes.reminderId;
    assert(testReminderId, `Created leave-behind reminder with ID: ${testReminderId}`);
    assert(reminderRes.onlyUnpacked === true, 'onlyUnpacked flag enabled');
    assert(reminderRes.itemIds.length === 2, 'Linked 2 specific items to reminder');

    // 5. Smart Geofence Exit Evaluation Engine
    console.log('\n--- 5. Testing Smart Geofence Exit Evaluation Engine ---');

    // Scenario A: User exits location with UNPACKED items
    // (Both items are currently unpacked)
    const exitEval1 = await reminderService.evaluateGeofenceExit(testUserId, testLocationId);
    assert(exitEval1.shouldNotify === true, 'Exit evaluation triggers alert when items are unpacked');
    assert(
      Array.isArray(exitEval1.alerts) && exitEval1.alerts.length > 0,
      'Exit evaluation returned structured alert payload'
    );
    assert(
      exitEval1.alerts[0].missingItems.includes('MacBook Pro') &&
        exitEval1.alerts[0].missingItems.includes('Office Access Card'),
      'Alert correctly identifies both unpacked items'
    );

    // Scenario B: User marks all items PACKED, then exits location
    console.log('\n--- Scenario B: Marking all items packed before leaving ---');
    await itemService.updateItemStatus(testUserId, testItemId1, { isPacked: true });
    await itemService.updateItemStatus(testUserId, testItemId2, { isPacked: true });

    const exitEval2 = await reminderService.evaluateGeofenceExit(testUserId, testLocationId);
    assert(
      exitEval2.shouldNotify === false,
      'Exit alert properly SUPPRESSED because all items are packed!'
    );
    assert(
      exitEval2.reason.includes('already been packed'),
      `Suppression reason clear: "${exitEval2.reason}"`
    );

    // Scenario C: One item becomes UNPACKED again
    console.log('\n--- Scenario C: One item remains unpacked ---');
    await itemService.updateItemStatus(testUserId, testItemId2, { isPacked: false }); // Office Card unpacked

    const exitEval3 = await reminderService.evaluateGeofenceExit(testUserId, testLocationId);
    assert(exitEval3.shouldNotify === true, 'Exit alert triggers for the remaining unpacked item');
    assert(
      exitEval3.alerts[0].missingItems.includes('Office Access Card') &&
        !exitEval3.alerts[0].missingItems.includes('MacBook Pro'),
      'Alert includes ONLY the unpacked item ("Office Access Card"), excluding packed MacBook'
    );

    // Scenario D: Reminder is DISABLED
    console.log('\n--- Scenario D: Reminder disabled ---');
    await reminderService.toggleReminderEnabled(testUserId, testReminderId, false);
    const exitEval4 = await reminderService.evaluateGeofenceExit(testUserId, testLocationId);
    assert(exitEval4.shouldNotify === false, 'Exit alert suppressed when reminder is disabled');
    await reminderService.toggleReminderEnabled(testUserId, testReminderId, true); // Re-enable

    // Scenario E: Location is INACTIVE
    console.log('\n--- Scenario E: Location inactive ---');
    await locationService.toggleLocationActive(testUserId, testLocationId, false);
    const exitEval5 = await reminderService.evaluateGeofenceExit(testUserId, testLocationId);
    assert(exitEval5.shouldNotify === false, 'Exit alert suppressed when location is inactive');
    await locationService.toggleLocationActive(testUserId, testLocationId, true); // Re-activate

    // 6. Notification Center History & Preferences
    console.log('\n--- 6. Testing In-App Notification Center & History ---');
    const notifications = await notificationHistoryService.getNotifications(testUserId);
    assert(
      Array.isArray(notifications) && notifications.length > 0,
      `In-app notification center captured ${notifications.length} alerts from exit evaluations`
    );

    const firstNotif = notifications[0];
    assert(firstNotif.isRead === false, 'Notification initially has isRead: false');

    // Mark as read
    const readResult = await notificationHistoryService.markAsRead(testUserId, firstNotif.notificationId);
    assert(readResult.isRead === true, 'Marked notification as read');

    // Mark all as read
    const allReadResult = await notificationHistoryService.markAllAsRead(testUserId);
    assert(allReadResult.success === true, 'Mark all as read succeeded');

    // User preferences
    const defaultPrefs = await notificationHistoryService.getUserPreferences(testUserId);
    assert(
      defaultPrefs.leaveBehindAlertsEnabled === true,
      'Default preferences have leaveBehindAlertsEnabled: true'
    );

    const updatedPrefs = await notificationHistoryService.updateUserPreferences(testUserId, {
      soundEnabled: false,
    });
    assert(updatedPrefs.soundEnabled === false, 'User preference updated soundEnabled: false');

    // Clear all notifications
    const clearResult = await notificationHistoryService.clearAllNotifications(testUserId);
    assert(clearResult.success === true, 'Cleared all in-app notifications');
    const emptyNotifs = await notificationHistoryService.getNotifications(testUserId);
    assert(emptyNotifs.length === 0, 'Notification center empty after clear-all');

    // 7. Deleting a Location with Active Reminders
    console.log('\n--- 7. Testing Cascading Location Deletion ---');
    await locationService.deleteLocation(testUserId, testLocationId);
    const reminderAfterLocDel = await reminderService.getReminderById(testUserId, testReminderId);
    assert(
      reminderAfterLocDel.isEnabled === false && reminderAfterLocDel.locationDeleted === true,
      'Deleting location automatically deactivates associated reminders'
    );

    // 8. Protected Route Security Guards (HTTP 401 on unauthenticated calls)
    console.log('\n--- 8. Testing Protected Route Security Guards ---');
    const app = require('../server');
    const http = require('http');
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const ephemeralPort = server.address().port;

    const endpoints = [
      { method: 'GET', path: '/api/locations' },
      { method: 'POST', path: '/api/locations' },
      { method: 'GET', path: `/api/locations/${testLocationId}` },
      { method: 'PUT', path: `/api/locations/${testLocationId}` },
      { method: 'PATCH', path: `/api/locations/${testLocationId}/toggle` },
      { method: 'DELETE', path: `/api/locations/${testLocationId}` },
      { method: 'GET', path: '/api/reminders' },
      { method: 'POST', path: '/api/reminders' },
      { method: 'POST', path: '/api/reminders/evaluate-exit' },
      { method: 'GET', path: `/api/reminders/${testReminderId}` },
      { method: 'PUT', path: `/api/reminders/${testReminderId}` },
      { method: 'PATCH', path: `/api/reminders/${testReminderId}/toggle` },
      { method: 'DELETE', path: `/api/reminders/${testReminderId}` },
      { method: 'GET', path: '/api/notifications' },
      { method: 'POST', path: '/api/notifications' },
      { method: 'PATCH', path: '/api/notifications/mark-all-read' },
      { method: 'DELETE', path: '/api/notifications/clear-all' },
      { method: 'GET', path: '/api/notifications/preferences' },
      { method: 'PUT', path: '/api/notifications/preferences' },
    ];

    for (const ep of endpoints) {
      const res = await fetch(`http://localhost:${ephemeralPort}${ep.path}`, {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' },
        body: ep.method !== 'GET' ? JSON.stringify({}) : undefined,
      });
      assert(res.status === 401, `${ep.method} ${ep.path} rejected unauthenticated request with 401`);
    }

    await new Promise((resolve) => server.close(resolve));
  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    // 9. Cleanup test artifacts in Firestore
    console.log('\n--- 9. Cleaning Up Test Artifacts ---');
    try {
      const batch = db.batch();
      if (testListId) {
        batch.delete(db.collection('packingLists').doc(testListId));
      }
      if (testReminderId) {
        batch.delete(db.collection('reminders').doc(testReminderId));
      }
      if (testItemId1) {
        batch.delete(db.collection('items').doc(testItemId1));
      }
      if (testItemId2) {
        batch.delete(db.collection('items').doc(testItemId2));
      }
      batch.delete(db.collection('users').doc(testUserId));
      batch.delete(db.collection('users').doc(otherUserId));
      batch.delete(db.collection('userPreferences').doc(testUserId));
      await batch.commit();
      console.log('Cleaned up test documents from Firestore.');
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr.message);
    }
  }

  console.log('\n=======================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('=======================================================');

  process.exit(failed > 0 ? 1 : 0);
}

runMilestone5Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

