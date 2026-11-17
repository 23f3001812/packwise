/**
 * PackWise Milestone 4 Automated Verification Test Suite
 * Tests Real-Time Collaborative Packing, RBAC (Owner, Editor, Viewer),
 * Invitations Lifecycle, Authorship Attribution, and Route Security.
 */

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const { getDb } = require('../config/firebaseAdmin');
const collaborationService = require('../services/collaborationService');
const itemService = require('../services/itemService');
const listService = require('../services/listService');

async function runMilestone4Tests() {
  console.log('=======================================================');
  console.log('🧪 PACKWISE MILESTONE 4 VERIFICATION TEST SUITE');
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
  const ownerId = `test_owner_${timestamp}`;
  const editorId = `test_editor_${timestamp}`;
  const viewerId = `test_viewer_${timestamp}`;

  const ownerEmail = `owner_${timestamp}@packwise.test`;
  const editorEmail = `editor_${timestamp}@packwise.test`;
  const viewerEmail = `viewer_${timestamp}@packwise.test`;

  let testListId = null;
  let invitationId = null;
  let testItemId = null;

  try {
    // 0. Setup Test Users and User Profiles in Firestore
    console.log('--- 0. Setup Test Users in Firestore ---');
    await db.collection('users').doc(ownerId).set({
      userId: ownerId,
      email: ownerEmail,
      displayName: 'Prachi (Owner)',
      name: 'Prachi (Owner)',
      createdAt: new Date(),
    });
    await db.collection('users').doc(editorId).set({
      userId: editorId,
      email: editorEmail,
      displayName: 'Rohan (Editor)',
      name: 'Rohan (Editor)',
      createdAt: new Date(),
    });
    await db.collection('users').doc(viewerId).set({
      userId: viewerId,
      email: viewerEmail,
      displayName: 'Aditya (Viewer)',
      name: 'Aditya (Viewer)',
      createdAt: new Date(),
    });
    assert(true, 'Created test user profiles in Firestore');

    // 1. Create a Test Packing List with Milestone 4 metadata
    console.log('\n--- 1. Testing Collaborative List Initialization ---');
    const listResult = await listService.createPackingList(ownerId, {
      eventName: 'Shimla Group Trek',
      destination: 'Shimla, India',
      eventType: 'Adventure',
      startDate: '2026-12-20',
      endDate: '2026-12-25',
    });
    testListId = listResult.listId;
    assert(testListId, `Created collaborative list with ID: ${testListId}`);

    const listSnap = await db.collection('packingLists').doc(testListId).get();
    const listData = listSnap.data();
    assert(listData.ownerId === ownerId, 'List ownerId correctly matches creator UID');
    assert(Array.isArray(listData.memberIds) && listData.memberIds.includes(ownerId), 'List memberIds array contains owner');
    assert(listData.memberCount === 1, 'Initial memberCount is 1');

    // 2. Self-Invitation Prevention
    console.log('\n--- 2. Testing Self-Invitation Prevention ---');
    try {
      await collaborationService.sendInvitation(
        ownerId,
        ownerEmail,
        'Prachi (Owner)',
        { listId: testListId, email: ownerEmail, role: 'editor' }
      );
      assert(false, 'Self-invitation should throw an error');
    } catch (err) {
      assert(
        err.message.includes('cannot invite yourself'),
        `Properly rejected self-invitation: "${err.message}"`
      );
    }

    // 3. Send Invitation to Editor & Test Duplicate Check
    console.log('\n--- 3. Testing Invitation Creation & Duplicate Prevention ---');
    const inviteResult = await collaborationService.sendInvitation(
      ownerId,
      ownerEmail,
      'Prachi (Owner)',
      { listId: testListId, email: editorEmail, role: 'editor' }
    );
    invitationId = inviteResult.invitationId;
    assert(invitationId, `Invitation generated with ID: ${invitationId}`);

    const inviteDoc = await db.collection('collaborationInvitations').doc(invitationId).get();
    assert(inviteDoc.exists, 'Invitation document persisted in Firestore');
    assert(inviteDoc.data().status === 'pending', 'Invitation status is "pending"');
    assert(inviteDoc.data().role === 'editor', 'Role offered is "editor"');

    // Duplicate test
    try {
      await collaborationService.sendInvitation(
        ownerId,
        ownerEmail,
        'Prachi (Owner)',
        { listId: testListId, email: editorEmail, role: 'editor' }
      );
      assert(false, 'Duplicate pending invitation should be rejected');
    } catch (err) {
      assert(
        err.message.toLowerCase().includes('pending invitation'),
        'Duplicate pending invitation properly blocked'
      );
    }

    // 4. Accept Invitation Flow
    console.log('\n--- 4. Testing Invitation Acceptance & Membership Activation ---');
    const acceptResult = await collaborationService.acceptInvitation(
      editorId,
      editorEmail,
      'Rohan (Editor)',
      invitationId
    );
    assert(acceptResult.success === true, 'Accept invitation returned success');
    assert(acceptResult.role === 'editor', 'Accepted role confirmed as "editor"');

    // Verify invitation status is 'accepted'
    const updatedInvite = await db.collection('collaborationInvitations').doc(invitationId).get();
    assert(updatedInvite.data().status === 'accepted', 'Invitation marked status: "accepted"');

    // Verify list document updated
    const updatedListSnap = await db.collection('packingLists').doc(testListId).get();
    const updatedListData = updatedListSnap.data();
    assert(updatedListData.isCollaborative === true, 'List flagged as isCollaborative: true');
    assert(updatedListData.memberIds.includes(editorId), 'memberIds array contains editorId');
    assert(updatedListData.memberCount === 2, 'memberCount incremented to 2');

    // Verify member subcollection document
    const memberDoc = await db
      .collection('packingLists')
      .doc(testListId)
      .collection('members')
      .doc(editorId)
      .get();
    assert(memberDoc.exists, 'Member document created in subcollection');
    assert(memberDoc.data().role === 'editor', 'Member role is "editor"');

    // 5. Test Invitation Rejection & Cancellation
    console.log('\n--- 5. Testing Invitation Rejection & Cancellation ---');
    // Invite viewer then reject
    const viewerInvite1 = await collaborationService.sendInvitation(
      ownerId,
      ownerEmail,
      'Prachi (Owner)',
      { listId: testListId, email: viewerEmail, role: 'viewer' }
    );
    await collaborationService.rejectInvitation(viewerId, viewerEmail, viewerInvite1.invitationId);
    const rejectedDoc = await db.collection('collaborationInvitations').doc(viewerInvite1.invitationId).get();
    assert(rejectedDoc.data().status === 'rejected', 'Invitation status set to "rejected"');

    // Invite viewer again then cancel by owner
    const viewerInvite2 = await collaborationService.sendInvitation(
      ownerId,
      ownerEmail,
      'Prachi (Owner)',
      { listId: testListId, email: viewerEmail, role: 'viewer' }
    );
    await collaborationService.cancelInvitation(ownerId, viewerInvite2.invitationId);
    const cancelledDoc = await db.collection('collaborationInvitations').doc(viewerInvite2.invitationId).get();
    assert(cancelledDoc.data().status === 'cancelled', 'Owner successfully cancelled pending invitation');

    // Now invite viewer for real and accept
    const viewerInvite3 = await collaborationService.sendInvitation(
      ownerId,
      ownerEmail,
      'Prachi (Owner)',
      { listId: testListId, email: viewerEmail, role: 'viewer' }
    );
    await collaborationService.acceptInvitation(
      viewerId,
      viewerEmail,
      'Aditya (Viewer)',
      viewerInvite3.invitationId
    );
    assert(true, 'Viewer accepted invitation successfully');

    // 6. Role-Based Access Control (RBAC) on Items & Authorship Attribution
    console.log('\n--- 6. Testing RBAC on Items & Authorship Attribution ---');

    // 6A. Editor adds an item -> Allowed
    const itemByEditor = await itemService.addItemToList(editorId, testListId, {
      itemName: 'First Aid Kit',
      category: 'Medicines',
      quantity: 1,
      priority: 'High',
    });
    testItemId = itemByEditor.itemId;
    assert(testItemId, 'Editor successfully added item to shared list');
    assert(itemByEditor.createdBy === editorId, 'Item authorship createdBy matches editor UID');
    assert(itemByEditor.createdByName === 'Rohan (Editor)', 'Item authorship createdByName populated');

    // 6B. Editor updates item status -> Allowed
    const statusUpdate = await itemService.updateItemStatus(editorId, testItemId, {
      isPacked: true,
      isUnpacked: false,
    });
    assert(statusUpdate.isPacked === true, 'Editor successfully updated item packing status');
    assert(statusUpdate.updatedBy === editorId, 'Item updatedBy tracks editor UID');

    // 6C. Viewer attempts to add item -> Must be BLOCKED
    try {
      await itemService.addItemToList(viewerId, testListId, {
        itemName: 'Viewer Forbidden Item',
        category: 'Electronics',
        quantity: 1,
      });
      assert(false, 'Viewer should be forbidden from adding items');
    } catch (err) {
      assert(
        err.message.includes('read-only access') || err.message.includes('permission'),
        `Viewer item creation blocked: "${err.message}"`
      );
    }

    // 6D. Viewer attempts to update item status -> Must be BLOCKED
    try {
      await itemService.updateItemStatus(viewerId, testItemId, {
        isPacked: false,
      });
      assert(false, 'Viewer should be forbidden from modifying item status');
    } catch (err) {
      assert(
        err.message.includes('read-only access') || err.message.includes('permission'),
        `Viewer item status change blocked: "${err.message}"`
      );
    }

    // 6E. Viewer attempts to delete item -> Must be BLOCKED
    try {
      await itemService.deleteItem(viewerId, testItemId);
      assert(false, 'Viewer should be forbidden from deleting items');
    } catch (err) {
      assert(
        err.message.includes('read-only access') || err.message.includes('permission'),
        `Viewer item deletion blocked: "${err.message}"`
      );
    }

    // 7. Member Role Management & Non-Owner Protection
    console.log('\n--- 7. Testing Member Role Management ---');
    // Owner promotes viewer to editor
    const roleChange = await collaborationService.updateMemberRole(ownerId, testListId, viewerId, 'editor');
    assert(roleChange.success === true, 'Owner promoted viewer to editor');

    // Non-owner (editor) attempts to change owner's role -> BLOCKED
    try {
      await collaborationService.updateMemberRole(editorId, testListId, ownerId, 'viewer');
      assert(false, 'Non-owner should not be able to change roles');
    } catch (err) {
      assert(
        err.message.includes('Only the list owner'),
        `Non-owner role change blocked: "${err.message}"`
      );
    }

    // 8. Member Removal & Leave List
    console.log('\n--- 8. Testing Member Removal & Leave List ---');
    // Owner removes viewer
    const removeResult = await collaborationService.removeMember(ownerId, testListId, viewerId);
    assert(removeResult.success === true, 'Owner removed collaborator');

    const checkListAfterRemoval = await db.collection('packingLists').doc(testListId).get();
    assert(!checkListAfterRemoval.data().memberIds.includes(viewerId), 'Removed member absent from memberIds');

    // Editor leaves list
    const leaveResult = await collaborationService.leaveList(editorId, testListId);
    assert(leaveResult.success === true, 'Editor successfully left the shared list');

    // Owner attempts to leave own list -> BLOCKED
    try {
      await collaborationService.leaveList(ownerId, testListId);
      assert(false, 'Owner should not be allowed to leave own list');
    } catch (err) {
      assert(
        err.message.toLowerCase().includes('cannot leave'),
        `Owner leave attempt properly blocked: "${err.message}"`
      );
    }

    // 9. Shared Lists Retrieval
    console.log('\n--- 9. Testing Shared Lists Retrieval ---');
    // Add editor back as a collaborator to test retrieval
    await db.collection('packingLists').doc(testListId).update({
      memberIds: [ownerId, editorId],
      isCollaborative: true,
      memberCount: 2,
    });
    await db.collection('packingLists').doc(testListId).collection('members').doc(editorId).set({
      userId: editorId,
      email: editorEmail,
      displayName: 'Rohan (Editor)',
      role: 'editor',
      status: 'active',
      joinedAt: new Date(),
    });

    const sharedLists = await collaborationService.getSharedListsForUser(editorId);
    assert(Array.isArray(sharedLists), 'getSharedListsForUser returned array');
    assert(
      sharedLists.some((l) => l.listId === testListId && l.myRole === 'editor'),
      'Shared list identified with correct role for collaborator'
    );

    // 10. Route Security & Authentication Guards (HTTP 401 on unauthenticated calls)
    console.log('\n--- 10. Testing Protected Route Security Guards ---');
    const app = require('../server');
    const http = require('http');
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const ephemeralPort = server.address().port;

    const endpoints = [
      { method: 'GET', path: '/api/collaboration/invitations/received' },
      { method: 'POST', path: '/api/collaboration/invitations' },
      { method: 'POST', path: `/api/collaboration/invitations/${invitationId}/accept` },
      { method: 'POST', path: `/api/collaboration/invitations/${invitationId}/reject` },
      { method: 'POST', path: `/api/collaboration/invitations/${invitationId}/cancel` },
      { method: 'GET', path: `/api/collaboration/lists/${testListId}/members` },
      { method: 'PATCH', path: `/api/collaboration/lists/${testListId}/members/${editorId}/role` },
      { method: 'DELETE', path: `/api/collaboration/lists/${testListId}/members/${editorId}` },
      { method: 'POST', path: `/api/collaboration/lists/${testListId}/leave` },
      { method: 'GET', path: '/api/collaboration/lists/shared-with-me' },
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
    // 11. Cleanup test artifacts in Firestore
    console.log('\n--- 11. Cleaning Up Test Artifacts ---');
    try {
      if (testListId) {
        const membersSnap = await db.collection('packingLists').doc(testListId).collection('members').get();
        const batch = db.batch();
        membersSnap.forEach((doc) => batch.delete(doc.ref));
        batch.delete(db.collection('packingLists').doc(testListId));

        const itemsSnap = await db.collection('items').where('listId', '==', testListId).get();
        itemsSnap.forEach((doc) => batch.delete(doc.ref));

        const invitesSnap = await db.collection('collaborationInvitations').where('listId', '==', testListId).get();
        invitesSnap.forEach((doc) => batch.delete(doc.ref));

        batch.delete(db.collection('users').doc(ownerId));
        batch.delete(db.collection('users').doc(editorId));
        batch.delete(db.collection('users').doc(viewerId));

        await batch.commit();
        console.log('Cleaned up test users, list, members, items, and invitations from Firestore.');
      }
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr.message);
    }
  }

  console.log('\n=======================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('=======================================================');

  process.exit(failed > 0 ? 1 : 0);
}

runMilestone4Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});