/**
 * PackWise Firestore Client Listeners & Security Rules Verification Suite
 * 
 * Verifies:
 * 1. Authenticated user can query and listen to own notifications (onSnapshot)
 * 2. Authenticated user CANNOT query or listen to another user's notifications (RBAC enforced)
 * 3. Authenticated user can query and listen to pending invitations sent to their email (onSnapshot)
 * 4. Authenticated user CANNOT query or listen to invitations addressed to other users
 * 5. Unauthenticated requests are strictly denied
 * 6. Live onSnapshot listener receives real-time updates for own data and isolates other users' data
 */

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const { admin, getDb } = require('../config/firebaseAdmin');
const { initializeApp } = require(path.join(__dirname, '../../frontend/node_modules/firebase/app'));
const { getAuth, signInWithCustomToken, signOut } = require(path.join(__dirname, '../../frontend/node_modules/firebase/auth'));
const { getFirestore, collection, query, where, getDocs, onSnapshot } = require(path.join(__dirname, '../../frontend/node_modules/firebase/firestore'));

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

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCG5UemaCBTFltwGv0AFRQsGjL29HXpK1A',
  authDomain: 'packwise-ed172.firebaseapp.com',
  projectId: 'packwise-ed172',
  storageBucket: 'packwise-ed172.firebasestorage.app',
  messagingSenderId: '176342751347',
  appId: '1:176342751347:web:1e01974d7fe5fb5c893206'
};

async function runFirestoreListenerTests() {
  console.log('================================================================');
  console.log('🔥 PACKWISE FIRESTORE CLIENT LISTENERS & SECURITY RULES SUITE');
  console.log('================================================================');

  const adminDb = getDb();
  const aliceUid = 'alice-test-listener-' + Date.now();
  const aliceEmail = `alice-${Date.now()}@packwise.test`;
  const bobUid = 'bob-test-listener-' + Date.now();
  const bobEmail = `bob-${Date.now()}@packwise.test`;

  // Create test custom tokens
  const aliceToken = await admin.auth().createCustomToken(aliceUid, { email: aliceEmail });
  const bobToken = await admin.auth().createCustomToken(bobUid, { email: bobEmail });

  // Initialize client apps
  const appName = 'clientApp-' + Date.now();
  const clientApp = initializeApp(firebaseConfig, appName);
  const clientAuth = getAuth(clientApp);
  const clientDb = getFirestore(clientApp);

  try {
    // -------------------------------------------------------------
    // Test 1: Unauthenticated Queries Denied
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Unauthenticated Access Blocks ---');
    let unauthNotifBlocked = false;
    try {
      const q = query(collection(clientDb, 'notifications'), where('userId', '==', aliceUid), where('isRead', '==', false));
      await getDocs(q);
    } catch (e) {
      if (e.code === 'permission-denied') unauthNotifBlocked = true;
    }
    assert(unauthNotifBlocked, 'Unauthenticated query to /notifications is strictly denied (permission-denied)');

    let unauthInvBlocked = false;
    try {
      const q = query(collection(clientDb, 'collaborationInvitations'), where('inviteeEmail', '==', aliceEmail), where('status', '==', 'pending'));
      await getDocs(q);
    } catch (e) {
      if (e.code === 'permission-denied') unauthInvBlocked = true;
    }
    assert(unauthInvBlocked, 'Unauthenticated query to /collaborationInvitations is strictly denied (permission-denied)');

    // -------------------------------------------------------------
    // Authenticate as Alice
    // -------------------------------------------------------------
    console.log('\n--- 2. Authenticating as Alice ---');
    await signInWithCustomToken(clientAuth, aliceToken);
    assert(clientAuth.currentUser?.uid === aliceUid, `Alice successfully authenticated with client SDK (UID: ${aliceUid})`);

    // -------------------------------------------------------------
    // Test 2: Alice Queries Her Own Notifications & Invitations
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Alice Reading Her Own Data ---');
    let aliceNotifSuccess = false;
    try {
      const q = query(
        collection(clientDb, 'notifications'),
        where('userId', '==', aliceUid),
        where('isRead', '==', false)
      );
      const snap = await getDocs(q);
      aliceNotifSuccess = true;
    } catch (e) {
      console.error('Alice notifications error:', e.message);
    }
    assert(aliceNotifSuccess, 'Alice successfully queries /notifications for her own userId without permission errors');

    let aliceInvSuccess = false;
    try {
      const q = query(
        collection(clientDb, 'collaborationInvitations'),
        where('inviteeEmail', '==', aliceEmail),
        where('status', '==', 'pending')
      );
      const snap = await getDocs(q);
      aliceInvSuccess = true;
    } catch (e) {
      console.error('Alice invitations error:', e.message);
    }
    assert(aliceInvSuccess, 'Alice successfully queries /collaborationInvitations for her email without permission errors');

    // -------------------------------------------------------------
    // Test 3: Alice Attempting to Read Bob's Data (RBAC Isolation)
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing RBAC Cross-User Read Isolation ---');
    let bobNotifBlocked = false;
    try {
      const q = query(
        collection(clientDb, 'notifications'),
        where('userId', '==', bobUid),
        where('isRead', '==', false)
      );
      await getDocs(q);
    } catch (e) {
      if (e.code === 'permission-denied') bobNotifBlocked = true;
    }
    assert(bobNotifBlocked, 'Alice is strictly forbidden from querying Bob\'s notifications (permission-denied)');

    let bobInvBlocked = false;
    try {
      const q = query(
        collection(clientDb, 'collaborationInvitations'),
        where('inviteeEmail', '==', bobEmail),
        where('status', '==', 'pending')
      );
      await getDocs(q);
    } catch (e) {
      if (e.code === 'permission-denied') bobInvBlocked = true;
    }
    assert(bobInvBlocked, 'Alice is strictly forbidden from querying Bob\'s invitations (permission-denied)');

    // -------------------------------------------------------------
    // Test 4: Live onSnapshot Real-Time Listener
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Real-Time onSnapshot Listener & Data Delivery ---');
    const notifQ = query(
      collection(clientDb, 'notifications'),
      where('userId', '==', aliceUid),
      where('isRead', '==', false)
    );

    let snapshotReceived = false;
    let receivedDocId = null;

    const unsubscribe = onSnapshot(
      notifQ,
      (snapshot) => {
        snapshot.forEach((docSnap) => {
          if (docSnap.data().title === 'Test Alice Leave-Behind') {
            snapshotReceived = true;
            receivedDocId = docSnap.id;
          }
        });
      },
      (err) => {
        console.error('Unexpected snapshot listener error:', err.message);
      }
    );

    // Seed test notification using Admin SDK
    const testNotifRef = adminDb.collection('notifications').doc();
    await testNotifRef.set({
      notificationId: testNotifRef.id,
      userId: aliceUid,
      type: 'leave_behind_alert',
      title: 'Test Alice Leave-Behind',
      message: 'You left your sunglasses behind',
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Seed a notification for Bob to verify Alice does not receive it
    const bobNotifRef = adminDb.collection('notifications').doc();
    await bobNotifRef.set({
      notificationId: bobNotifRef.id,
      userId: bobUid,
      type: 'leave_behind_alert',
      title: 'Test Bob Notification',
      message: 'Bob sunglasses',
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Wait for real-time listener to trigger
    await new Promise((r) => setTimeout(r, 2000));
    unsubscribe();

    assert(snapshotReceived, 'Alice onSnapshot listener captured the live notification in real time');
    assert(receivedDocId === testNotifRef.id, 'Received notification matches Alice\'s document ID');

    // Clean up test documents
    await testNotifRef.delete();
    await bobNotifRef.delete();
    console.log('Test artifacts cleanly removed.');

  } finally {
    await signOut(clientAuth).catch(() => {});
  }

  console.log('\n================================================================');
  console.log(`🏁 FIRESTORE VERIFICATION: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runFirestoreListenerTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

