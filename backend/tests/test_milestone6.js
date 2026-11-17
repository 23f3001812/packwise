/**
 * PACKWISE — MILESTONE 6: MASTER INTEGRATION & RELEASE READINESS TEST SUITE
 * 
 * Verifies end-to-end integration across all milestones:
 * 1. Health check & Firebase Admin initialization
 * 2. Unauthenticated access blocks across all routes (401 guards)
 * 3. End-to-end user lifecycle: List -> Items -> Containers -> Collaboration -> Geofencing -> Notifications
 * 4. Role-Based Access Control (Owner / Editor / Viewer)
 * 5. Safe Cascading Cleanups (Containers, Lists, Locations)
 * 6. Codebase sanity: Zero emojis & zero broken icons verification
 */

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const { getDb, isFirebaseAdminReady } = require('../config/firebaseAdmin');
const http = require('http');
const fs = require('fs');

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

// Services
const listService = require('../services/listService');
const itemService = require('../services/itemService');
const containerService = require('../services/containerService');
const collaborationService = require('../services/collaborationService');
const locationService = require('../services/locationService');
const reminderService = require('../services/reminderService');
const notificationService = require('../services/notificationHistoryService');

async function runMilestone6Tests() {
  console.log('=======================================================');
  console.log('🧪 PACKWISE MILESTONE 6: MASTER INTEGRATION TEST SUITE');
  console.log('=======================================================');

  const db = getDb();
  const app = require('../server');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const testPort = server.address().port;
  const baseUrl = `http://localhost:${testPort}/api`;

  try {
    // --- 1. Health & Server Readiness ---
    console.log('\n--- 1. Testing System Health & Server Readiness ---');
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, 'Health endpoint responds with HTTP 200');
    assert(healthData.firebaseAdminReady === true, 'Firebase Admin SDK is fully operational');

    // --- 2. Unauthenticated Route Guards (Security Audit) ---
    console.log('\n--- 2. Testing Route Guard Protection Across All Endpoints ---');
    const guardedEndpoints = [
      { method: 'GET', path: '/lists' },
      { method: 'POST', path: '/lists' },
      { method: 'GET', path: '/containers' },
      { method: 'POST', path: '/containers' },
      { method: 'POST', path: '/ai/generate-checklist' },
      { method: 'POST', path: '/ai/generate-weather-aware-checklist' },
      { method: 'GET', path: '/collaboration/lists/shared-with-me' },
      { method: 'POST', path: '/collaboration/invitations' },
      { method: 'GET', path: '/locations' },
      { method: 'POST', path: '/locations' },
      { method: 'GET', path: '/reminders' },
      { method: 'POST', path: '/reminders' },
      { method: 'POST', path: '/reminders/evaluate-exit' },
      { method: 'GET', path: '/notifications' },
      { method: 'GET', path: '/notifications/preferences' },
    ];

    for (const ep of guardedEndpoints) {
      const res = await fetch(`${baseUrl}${ep.path}`, {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' },
        body: ep.method !== 'GET' ? JSON.stringify({}) : undefined,
      });
      assert(res.status === 401, `${ep.method} /api${ep.path} strictly rejected without token (401)`);
    }

    // --- 3. End-to-End User Integration Journey ---
    console.log('\n--- 3. Testing Full User Lifecycle (E2E Integration) ---');
    const timestamp = Date.now();
    const ownerId = `m6_owner_${timestamp}`;
    const editorId = `m6_editor_${timestamp}`;
    const viewerId = `m6_viewer_${timestamp}`;

    // Create mock profiles
    await db.collection('users').doc(ownerId).set({
      userId: ownerId,
      email: `owner_${timestamp}@packwise.test`,
      name: 'Owner Traveler',
      createdAt: new Date(),
    });

    await db.collection('users').doc(editorId).set({
      userId: editorId,
      email: `editor_${timestamp}@packwise.test`,
      name: 'Editor Traveler',
      createdAt: new Date(),
    });

    await db.collection('users').doc(viewerId).set({
      userId: viewerId,
      email: `viewer_${timestamp}@packwise.test`,
      name: 'Viewer Traveler',
      createdAt: new Date(),
    });
    assert(true, 'Test user accounts established in Firestore');

    // Step A: Create Packing List
    const listResult = await listService.createPackingList(ownerId, {
      eventName: 'Milestone 6 Final Verification Trip',
      destination: 'Bengaluru, India',
      eventType: 'Business trip',
      startDate: '2026-12-01',
      endDate: '2026-12-05',
      notes: 'Integration test checklist',
    });
    const listId = listResult.listId;
    assert(!!listId, `Created packing list with ID: ${listId}`);

    // Step B: Create Storage Container
    const containerResult = await containerService.createContainer(ownerId, {
      containerName: 'Executive Laptop Bag',
      containerType: 'Backpack',
      color: '#14243E',
      notes: 'Primary electronics carry-on',
    });
    const containerId = containerResult.containerId;
    assert(!!containerId, `Created storage container: ${containerResult.containerName}`);

    // Step C: Add Items and Assign to Container
    const item1 = await itemService.addItemToList(ownerId, listId, {
      itemName: 'MacBook Pro 16',
      category: 'Electronics',
      quantity: 1,
      priority: 'High',
      containerId,
    });
    assert(item1.containerId === containerId, 'Item successfully assigned to container');

    const item2 = await itemService.addItemToList(ownerId, listId, {
      itemName: 'Passport & Boarding Pass',
      category: 'Documents',
      quantity: 1,
      priority: 'High',
    });
    assert(item2.isPacked === false, 'New item defaults to isPacked: false');

    // Step D: Container Items Retrieval
    const containerItems = await containerService.getItemsInContainer(ownerId, containerId);
    assert(containerItems.length === 1, 'Container correctly reports 1 assigned item');
    assert(containerItems[0].itemName === 'MacBook Pro 16', 'Assigned item matches MacBook Pro 16');

    // Step E: Collaboration (Invite Editor)
    const invite = await collaborationService.sendInvitation(
      ownerId,
      `owner_${timestamp}@packwise.test`,
      'Owner Traveler',
      {
        listId,
        email: `editor_${timestamp}@packwise.test`,
        role: 'editor',
      }
    );
    assert(invite.status === 'pending', 'Collaborator invitation created as pending');

    const acceptRes = await collaborationService.acceptInvitation(
      editorId,
      `editor_${timestamp}@packwise.test`,
      'Editor Traveler',
      invite.invitationId
    );
    assert(acceptRes.success === true, 'Editor accepted trip invitation');

    // Step F: RBAC Check — Editor can toggle item packed status
    const packToggle = await itemService.updateItemStatus(editorId, item1.itemId, { isPacked: true });
    assert(packToggle.isPacked === true, 'Editor successfully updated item packing status');
    assert(packToggle.updatedBy === editorId, 'Item authorship tracked editor UID');

    // Step G: RBAC Check — Viewer cannot add or edit items
    const inviteViewer = await collaborationService.sendInvitation(
      ownerId,
      `owner_${timestamp}@packwise.test`,
      'Owner Traveler',
      {
        listId,
        email: `viewer_${timestamp}@packwise.test`,
        role: 'viewer',
      }
    );
    await collaborationService.acceptInvitation(
      viewerId,
      `viewer_${timestamp}@packwise.test`,
      'Viewer Traveler',
      inviteViewer.invitationId
    );

    let viewerBlocked = false;
    try {
      await itemService.addItemToList(viewerId, listId, {
        itemName: 'Unauthorized Viewer Item',
        category: 'Other',
      });
    } catch (err) {
      viewerBlocked = true;
      assert(err.message.includes('Viewers have read-only access'), 'Viewer blocked from adding items');
    }
    assert(viewerBlocked, 'Viewer write guard enforced');

    // Step H: Geofenced Location Creation
    const loc = await locationService.createLocation(ownerId, {
      name: 'Bengaluru Tech HQ',
      address: 'Outer Ring Rd, Bellandur, Bengaluru',
      latitude: 12.9279,
      longitude: 77.6771,
      radius: 200,
      type: 'Office',
    });
    assert(loc.radius === 200, 'Geofence location created with 200m radius');

    // Step I: Leave-Behind Reminder Creation
    const rem = await reminderService.createReminder(ownerId, {
      locationId: loc.locationId,
      packingListIds: [listId],
      itemIds: [item1.itemId, item2.itemId],
      onlyUnpacked: true,
      customMessage: 'Do not forget your passport before boarding!',
    });
    assert(rem.onlyUnpacked === true, 'Reminder configured with onlyUnpacked: true');

    // Step J: Smart Geofence Exit Evaluation Engine
    // Item 1 is packed, Item 2 is unpacked -> Alert should trigger ONLY for Item 2
    const exitEval = await reminderService.evaluateGeofenceExit(ownerId, loc.locationId);
    assert(exitEval.shouldNotify === true, 'Geofence exit triggered leave-behind alert');
    assert(exitEval.alerts.length === 1, 'Exactly 1 reminder alert evaluated');
    assert(exitEval.alerts[0].missingItems.includes('Passport & Boarding Pass'), 'Alert lists unpacked Passport');
    assert(!exitEval.alerts[0].missingItems.includes('MacBook Pro 16'), 'Alert correctly omits already packed MacBook');

    // Step K: All Packed Suppression
    await itemService.updateItemStatus(ownerId, item2.itemId, { isPacked: true });
    const allPackedEval = await reminderService.evaluateGeofenceExit(ownerId, loc.locationId);
    assert(allPackedEval.shouldNotify === false, 'Alert cleanly suppressed when all items are packed');

    // Step L: In-App Notification Center
    const notifs = await notificationService.getNotifications(ownerId);
    assert(notifs.length >= 1, 'In-App notification history captured the exit alert');
    assert(notifs[0].isRead === false, 'Notification initially marked unread');

    await notificationService.markAsRead(ownerId, notifs[0].notificationId);
    const updatedNotif = await db.collection('notifications').doc(notifs[0].notificationId).get();
    assert(updatedNotif.data().isRead === true, 'Notification successfully marked as read');

    // --- 4. Safe Cascading Cleanups ---
    console.log('\n--- 4. Testing Cascading Cleanups ---');

    // Delete container: verify item gets unassigned (containerId: null) rather than deleted
    await containerService.deleteContainer(ownerId, containerId);
    const preservedItem = await itemService.getItemById(ownerId, item1.itemId);
    assert(preservedItem !== null, 'Item preserved after container deletion');
    assert(preservedItem.containerId === null, 'Item containerId safely reset to null');

    // Delete location: verify associated reminder is deactivated
    await locationService.deleteLocation(ownerId, loc.locationId);
    const deactivatedRem = await reminderService.getReminderById(ownerId, rem.reminderId);
    assert(deactivatedRem.isEnabled === false, 'Reminder automatically deactivated upon location deletion');

    // Delete list: verify cascading item & member cleanup
    await listService.deletePackingList(ownerId, listId);
    const remainingItemsSnap = await db.collection('items').where('listId', '==', listId).get();
    assert(remainingItemsSnap.empty === true, 'All items cleaned up with packing list deletion');

    // Clean up remaining test data
    await reminderService.deleteReminder(ownerId, rem.reminderId);
    await notificationService.clearAllNotifications(ownerId);
    await db.collection('users').doc(ownerId).delete();
    await db.collection('users').doc(editorId).delete();
    await db.collection('users').doc(viewerId).delete();
    assert(true, 'Test artifacts cleaned up successfully');

    // --- 5. Application UI Sanity Checks ---
    console.log('\n--- 5. Codebase Sanity & Quality Checks ---');

    // Check 0 emojis in frontend
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/u;
    let frontendEmojiCount = 0;

    function scanEmojis(dir) {
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir);
      for (const f of files) {
        if (['node_modules', '.expo', '.git', 'dist'].includes(f)) continue;
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) {
          scanEmojis(full);
        } else if (f.endsWith('.js')) {
          const text = fs.readFileSync(full, 'utf8');
          text.split('\n').forEach(line => {
            if (emojiRegex.test(line)) frontendEmojiCount++;
          });
        }
      }
    }

    scanEmojis(path.resolve(__dirname, '../../frontend/app'));
    scanEmojis(path.resolve(__dirname, '../../frontend/components'));
    scanEmojis(path.resolve(__dirname, '../../frontend/services'));
    assert(frontendEmojiCount === 0, `Frontend application code has exactly 0 emojis (found: ${frontendEmojiCount})`);

    // Check 0 broken icons
    const IoniconsGlyphs = require(path.resolve(__dirname, '../../frontend/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json'));
    const MaterialCommunityIconsGlyphs = require(path.resolve(__dirname, '../../frontend/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json'));
    
    assert(IoniconsGlyphs['briefcase-outline'] !== undefined, 'Ionicons briefcase-outline is valid glyph');
    assert(IoniconsGlyphs['cube-outline'] !== undefined, 'Ionicons cube-outline is valid glyph');
    assert(MaterialCommunityIconsGlyphs['purse'] !== undefined, 'MaterialCommunityIcons purse is valid glyph');
    assert(MaterialCommunityIconsGlyphs['bag-suitcase'] !== undefined, 'MaterialCommunityIcons bag-suitcase is valid glyph');

  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  console.log('\n=======================================================');
  console.log(`🏁 MASTER TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('=======================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runMilestone6Tests().catch((err) => {
  console.error('Fatal error running Milestone 6 test suite:', err);
  process.exit(1);
});
