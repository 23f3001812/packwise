/**
 * PackWise Collaboration Service
 * Handles collaborative list membership, invitation lifecycles, role-based access,
 * and shared list aggregation.
 */

const { getDb, admin } = require('../config/firebaseAdmin');

const VALID_ROLES = ['owner', 'editor', 'viewer'];

/**
 * Validates an email address.
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim().toLowerCase());
}

/**
 * Checks a user's role on a packing list.
 * Returns { isMember: boolean, role: string|null, isOwner: boolean, listData: object }
 */
async function checkUserListAccess(db, userId, listId) {
  const listRef = db.collection('packingLists').doc(listId);
  const listDoc = await listRef.get();

  if (!listDoc.exists) {
    const err = new Error('Packing list not found.');
    err.statusCode = 404;
    throw err;
  }

  const listData = listDoc.data();
  const isOwner = listData.userId === userId || listData.ownerId === userId;

  if (isOwner) {
    return {
      isMember: true,
      role: 'owner',
      isOwner: true,
      listData
    };
  }

  // Check membership subcollection
  const memberDoc = await listRef.collection('members').doc(userId).get();
  if (memberDoc.exists && memberDoc.data().status === 'active') {
    return {
      isMember: true,
      role: memberDoc.data().role || 'editor',
      isOwner: false,
      listData
    };
  }

  // Also check top-level memberIds array as fallback
  if (Array.isArray(listData.memberIds) && listData.memberIds.includes(userId)) {
    return {
      isMember: true,
      role: 'editor',
      isOwner: false,
      listData
    };
  }

  return {
    isMember: false,
    role: null,
    isOwner: false,
    listData
  };
}

/**
 * Sends a collaboration invitation for a packing list.
 */
async function sendInvitation(inviterId, inviterEmail, inviterName, { listId, email, role = 'editor' }) {
  const db = getDb();

  if (!listId || !listId.trim()) {
    throw new Error('List ID is required.');
  }

  if (!isValidEmail(email)) {
    const error = new Error('Please enter a valid email address.');
    error.statusCode = 400;
    throw error;
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanRole = VALID_ROLES.includes(role.toLowerCase()) ? role.toLowerCase() : 'editor';

  if (cleanRole === 'owner') {
    const error = new Error('Cannot invite a user directly as owner.');
    error.statusCode = 400;
    throw error;
  }

  // 1. Verify caller is list owner
  const access = await checkUserListAccess(db, inviterId, listId);
  if (!access.isOwner) {
    const error = new Error('Unauthorized. Only the list owner can invite collaborators.');
    error.statusCode = 403;
    throw error;
  }

  const listData = access.listData;

  // 2. Prevent inviting the list owner / self
  if (inviterEmail && inviterEmail.toLowerCase() === cleanEmail) {
    const error = new Error('You cannot invite yourself to your own list.');
    error.statusCode = 400;
    throw error;
  }

  // 3. Resolve invitee in Firebase Auth if registered
  let inviteeUserId = null;
  let inviteeDisplayName = '';
  try {
    const userRecord = await admin.auth().getUserByEmail(cleanEmail);
    inviteeUserId = userRecord.uid;
    inviteeDisplayName = userRecord.displayName || cleanEmail.split('@')[0];
  } catch (authErr) {
    // User might not have signed up yet. We allow sending invitation to registered PackWise users
    // If not found in Auth, check users collection
    const userSnap = await db.collection('users').where('email', '==', cleanEmail).limit(1).get();
    if (!userSnap.empty) {
      inviteeUserId = userSnap.docs[0].id;
      inviteeDisplayName = userSnap.docs[0].data().name || cleanEmail.split('@')[0];
    }
  }

  // 4. Check if user is already an active member
  if (inviteeUserId) {
    const existingMember = await db
      .collection('packingLists')
      .doc(listId)
      .collection('members')
      .doc(inviteeUserId)
      .get();

    if (existingMember.exists && existingMember.data().status === 'active') {
      const error = new Error('This user is already a collaborator on this list.');
      error.statusCode = 400;
      throw error;
    }
  }

  // 5. Check for existing pending invitation for same list and email
  const pendingSnap = await db
    .collection('collaborationInvitations')
    .where('listId', '==', listId)
    .where('inviteeEmail', '==', cleanEmail)
    .where('status', '==', 'pending')
    .limit(1)
    .get();

  if (!pendingSnap.empty) {
    const error = new Error('A pending invitation has already been sent to this email address.');
    error.statusCode = 400;
    throw error;
  }

  // 6. Create invitation document
  const invRef = db.collection('collaborationInvitations').doc();
  const invitationId = invRef.id;
  const now = admin.firestore.FieldValue.serverTimestamp();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const newInvitation = {
    invitationId,
    listId,
    listName: listData.eventName || 'Shared Packing List',
    destination: listData.destination || '',
    ownerId: listData.userId,
    inviterId,
    inviterName: inviterName || inviterEmail || 'A PackWise user',
    inviterEmail: inviterEmail || '',
    inviteeEmail: cleanEmail,
    inviteeUserId,
    role: cleanRole,
    status: 'pending',
    createdAt: now,
    expiresAt,
    respondedAt: null
  };

  await invRef.set(newInvitation);

  return {
    ...newInvitation,
    invitationId,
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString()
  };
}

/**
 * Retrieves pending invitations received by a user.
 */
async function getReceivedInvitations(userEmail, userId = null) {
  const db = getDb();
  if (!userEmail) return [];

  const cleanEmail = userEmail.trim().toLowerCase();

  const snap = await db
    .collection('collaborationInvitations')
    .where('inviteeEmail', '==', cleanEmail)
    .where('status', '==', 'pending')
    .get();

  const invitations = [];
  snap.forEach((doc) => {
    const data = doc.data();
    invitations.push({
      invitationId: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
      expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate().toISOString() : data.expiresAt
    });
  });

  return invitations;
}

/**
 * Retrieves pending invitations sent for a list (Owner only).
 */
async function getSentInvitationsForList(userId, listId) {
  const db = getDb();
  const access = await checkUserListAccess(db, userId, listId);
  if (!access.isOwner) {
    const err = new Error('Unauthorized. Only the owner can view pending invitations.');
    err.statusCode = 403;
    throw err;
  }

  const snap = await db
    .collection('collaborationInvitations')
    .where('listId', '==', listId)
    .where('status', '==', 'pending')
    .get();

  const invitations = [];
  snap.forEach((doc) => {
    const data = doc.data();
    invitations.push({
      invitationId: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
    });
  });

  return invitations;
}

/**
 * Accepts an invitation.
 */
async function acceptInvitation(userId, userEmail, userName, invitationId) {
  const db = getDb();
  const invRef = db.collection('collaborationInvitations').doc(invitationId);
  const invDoc = await invRef.get();

  if (!invDoc.exists) {
    const err = new Error('Invitation not found.');
    err.statusCode = 404;
    throw err;
  }

  const invData = invDoc.data();

  // Verify recipient
  const cleanUserEmail = (userEmail || '').trim().toLowerCase();
  const isRecipient =
    invData.inviteeEmail.toLowerCase() === cleanUserEmail ||
    (invData.inviteeUserId && invData.inviteeUserId === userId);

  if (!isRecipient) {
    const err = new Error('Unauthorized. This invitation was not addressed to your account.');
    err.statusCode = 403;
    throw err;
  }

  if (invData.status !== 'pending') {
    const err = new Error(`Invitation is no longer pending (current status: ${invData.status}).`);
    err.statusCode = 400;
    throw err;
  }

  const listId = invData.listId;
  const listRef = db.collection('packingLists').doc(listId);
  const listDoc = await listRef.get();

  if (!listDoc.exists) {
    const err = new Error('The packing list associated with this invitation no longer exists.');
    err.statusCode = 404;
    throw err;
  }

  const now = admin.firestore.FieldValue.serverTimestamp();
  const role = invData.role || 'editor';
  const memberRef = listRef.collection('members').doc(userId);

  const batch = db.batch();

  // 1. Update invitation status
  batch.update(invRef, {
    status: 'accepted',
    respondedAt: now,
    inviteeUserId: userId
  });

  // 2. Add to list members subcollection
  batch.set(memberRef, {
    userId,
    email: cleanUserEmail,
    displayName: userName || cleanUserEmail.split('@')[0],
    role,
    status: 'active',
    joinedAt: now,
    invitedBy: invData.inviterId
  });

  // 3. Update list document top-level collaboration fields
  batch.update(listRef, {
    memberIds: admin.firestore.FieldValue.arrayUnion(userId),
    isCollaborative: true,
    memberCount: admin.firestore.FieldValue.increment(1),
    updatedAt: now
  });

  await batch.commit();

  return {
    success: true,
    listId,
    listName: invData.listName,
    role
  };
}

/**
 * Rejects an invitation.
 */
async function rejectInvitation(userId, userEmail, invitationId) {
  const db = getDb();
  const invRef = db.collection('collaborationInvitations').doc(invitationId);
  const invDoc = await invRef.get();

  if (!invDoc.exists) {
    const err = new Error('Invitation not found.');
    err.statusCode = 404;
    throw err;
  }

  const invData = invDoc.data();
  const cleanUserEmail = (userEmail || '').trim().toLowerCase();
  const isRecipient =
    invData.inviteeEmail.toLowerCase() === cleanUserEmail ||
    (invData.inviteeUserId && invData.inviteeUserId === userId);

  if (!isRecipient) {
    const err = new Error('Unauthorized. This invitation was not addressed to your account.');
    err.statusCode = 403;
    throw err;
  }

  if (invData.status !== 'pending') {
    const err = new Error(`Invitation is already ${invData.status}.`);
    err.statusCode = 400;
    throw err;
  }

  await invRef.update({
    status: 'rejected',
    respondedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true, invitationId };
}

/**
 * Cancels a sent invitation (Owner only).
 */
async function cancelInvitation(userId, invitationId) {
  const db = getDb();
  const invRef = db.collection('collaborationInvitations').doc(invitationId);
  const invDoc = await invRef.get();

  if (!invDoc.exists) {
    const err = new Error('Invitation not found.');
    err.statusCode = 404;
    throw err;
  }

  const invData = invDoc.data();
  if (invData.ownerId !== userId && invData.inviterId !== userId) {
    const err = new Error('Unauthorized. Only the owner or inviter can cancel this invitation.');
    err.statusCode = 403;
    throw err;
  }

  await invRef.update({
    status: 'cancelled',
    respondedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true, invitationId };
}

/**
 * Retrieves all members of a packing list.
 */
async function getListMembers(userId, listId) {
  const db = getDb();
  const access = await checkUserListAccess(db, userId, listId);
  if (!access.isMember) {
    const err = new Error('Unauthorized. You are not a member of this packing list.');
    err.statusCode = 403;
    throw err;
  }

  const listRef = db.collection('packingLists').doc(listId);
  const membersSnap = await listRef.collection('members').get();

  const members = [];
  membersSnap.forEach((doc) => {
    const data = doc.data();
    members.push({
      userId: doc.id,
      ...data,
      joinedAt: data.joinedAt?.toDate ? data.joinedAt.toDate().toISOString() : data.joinedAt
    });
  });

  // Ensure owner is always included in members list
  const ownerId = access.listData.userId || access.listData.ownerId;
  const hasOwner = members.some((m) => m.userId === ownerId || m.role === 'owner');
  if (!hasOwner) {
    let ownerName = access.listData.ownerName || 'List Owner';
    let ownerEmail = access.listData.ownerEmail || '';
    try {
      const ownerUser = await admin.auth().getUser(ownerId);
      ownerName = ownerUser.displayName || ownerName;
      ownerEmail = ownerUser.email || ownerEmail;
    } catch (_) {}

    members.unshift({
      userId: ownerId,
      displayName: ownerName,
      email: ownerEmail,
      role: 'owner',
      status: 'active',
      joinedAt: access.listData.createdAt?.toDate
        ? access.listData.createdAt.toDate().toISOString()
        : null
    });
  }

  // If caller is owner, also attach pending invitations
  let pendingInvitations = [];
  if (access.isOwner) {
    pendingInvitations = await getSentInvitationsForList(userId, listId);
  }

  return {
    listId,
    listName: access.listData.eventName,
    myRole: access.role,
    isOwner: access.isOwner,
    members,
    pendingInvitations
  };
}

/**
 * Updates a collaborator's role (Owner only).
 */
async function updateMemberRole(ownerUserId, listId, targetUserId, newRole) {
  const db = getDb();
  const access = await checkUserListAccess(db, ownerUserId, listId);

  if (!access.isOwner) {
    const err = new Error('Unauthorized. Only the list owner can change member roles.');
    err.statusCode = 403;
    throw err;
  }

  if (targetUserId === ownerUserId) {
    const err = new Error('Cannot change the owner role.');
    err.statusCode = 400;
    throw err;
  }

  const cleanRole = (newRole || '').toLowerCase();
  if (!['editor', 'viewer'].includes(cleanRole)) {
    const err = new Error('Invalid role. Allowed roles are "editor" or "viewer".');
    err.statusCode = 400;
    throw err;
  }

  const memberRef = db.collection('packingLists').doc(listId).collection('members').doc(targetUserId);
  const memberDoc = await memberRef.get();

  if (!memberDoc.exists) {
    const err = new Error('Member not found on this list.');
    err.statusCode = 404;
    throw err;
  }

  await memberRef.update({
    role: cleanRole,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true, userId: targetUserId, role: cleanRole };
}

/**
 * Removes a collaborator from the list (Owner only).
 */
async function removeMember(ownerUserId, listId, targetUserId) {
  const db = getDb();
  const access = await checkUserListAccess(db, ownerUserId, listId);

  if (!access.isOwner) {
    const err = new Error('Unauthorized. Only the list owner can remove collaborators.');
    err.statusCode = 403;
    throw err;
  }

  if (targetUserId === ownerUserId) {
    const err = new Error('Owner cannot be removed from the list.');
    err.statusCode = 400;
    throw err;
  }

  const listRef = db.collection('packingLists').doc(listId);
  const memberRef = listRef.collection('members').doc(targetUserId);

  const batch = db.batch();
  batch.delete(memberRef);
  batch.update(listRef, {
    memberIds: admin.firestore.FieldValue.arrayRemove(targetUserId),
    memberCount: admin.firestore.FieldValue.increment(-1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await batch.commit();

  return { success: true, removedUserId: targetUserId };
}

/**
 * Allows an authenticated non-owner collaborator to leave a shared list.
 */
async function leaveList(userId, listId) {
  const db = getDb();
  const access = await checkUserListAccess(db, userId, listId);

  if (access.isOwner) {
    const err = new Error('List owner cannot leave the list. You must delete the list instead.');
    err.statusCode = 400;
    throw err;
  }

  if (!access.isMember) {
    const err = new Error('You are not a member of this list.');
    err.statusCode = 404;
    throw err;
  }

  const listRef = db.collection('packingLists').doc(listId);
  const memberRef = listRef.collection('members').doc(userId);

  const batch = db.batch();
  batch.delete(memberRef);
  batch.update(listRef, {
    memberIds: admin.firestore.FieldValue.arrayRemove(userId),
    memberCount: admin.firestore.FieldValue.increment(-1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await batch.commit();

  return { success: true, listId };
}

/**
 * Retrieves all packing lists shared with the authenticated user (where user is not the owner).
 */
async function getSharedListsForUser(userId) {
  const db = getDb();

  // Find lists where memberIds contains userId
  const snap = await db
    .collection('packingLists')
    .where('memberIds', 'array-contains', userId)
    .get();

  const lists = [];
  const seenListIds = new Set();

  for (const doc of snap.docs) {
    const listData = doc.data();

    // Exclude lists owned by the user (those appear under "My Lists")
    if (listData.userId === userId || listData.ownerId === userId) {
      continue;
    }

    seenListIds.add(doc.id);

    // Determine user's role on this list
    let myRole = 'editor';
    const memberDoc = await doc.ref.collection('members').doc(userId).get();
    if (memberDoc.exists) {
      myRole = memberDoc.data().role || 'editor';
    }

    // Fetch items count for progress metrics
    const itemsSnap = await db.collection('items').where('listId', '==', doc.id).get();
    let totalItems = 0;
    let packedItems = 0;
    let unpackedItems = 0;

    itemsSnap.forEach((iDoc) => {
      totalItems += 1;
      const it = iDoc.data();
      if (it.isPacked) packedItems += 1;
      if (it.isUnpacked) unpackedItems += 1;
    });

    const packingProgress = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;

    // Resolve owner display name/email if not present
    let ownerName = listData.ownerName || null;
    let ownerEmail = listData.ownerEmail || null;
    const ownerUserId = listData.ownerId || listData.userId;
    if ((!ownerName || !ownerEmail) && ownerUserId) {
      try {
        const ownerDoc = await db.collection('users').doc(ownerUserId).get();
        if (ownerDoc.exists) {
          const oData = ownerDoc.data();
          ownerName = ownerName || oData.displayName || oData.name || null;
          ownerEmail = ownerEmail || oData.email || null;
        }
      } catch {
        // Fallback silently if user doc unreadable
      }
    }

    lists.push({
      listId: doc.id,
      ...listData,
      ownerName: ownerName || 'Trip Organizer',
      ownerEmail: ownerEmail || '',
      isSharedWithMe: true,
      myRole,
      stats: {
        totalItems,
        packedItems,
        unpackedItems,
        packingProgress
      }
    });
  }

  // Fallback: check members subcollection for any lists where user is active member
  try {
    const membersSnap = await db
      .collectionGroup('members')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .get();

    for (const mDoc of membersSnap.docs) {
      const parentRef = mDoc.ref.parent.parent;
      if (!parentRef || seenListIds.has(parentRef.id)) continue;

      const pDoc = await parentRef.get();
      if (!pDoc.exists) continue;

      const pData = pDoc.data();
      if (pData.userId === userId || pData.ownerId === userId) continue;

      seenListIds.add(parentRef.id);
      const myRole = mDoc.data()?.role || 'editor';

      const itemsSnap = await db.collection('items').where('listId', '==', parentRef.id).get();
      let totalItems = 0;
      let packedItems = 0;
      let unpackedItems = 0;

      itemsSnap.forEach((iDoc) => {
        totalItems += 1;
        const it = iDoc.data();
        if (it.isPacked) packedItems += 1;
        if (it.isUnpacked) unpackedItems += 1;
      });

      const packingProgress = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;

      lists.push({
        listId: parentRef.id,
        ...pData,
        ownerName: pData.ownerName || 'Trip Organizer',
        ownerEmail: pData.ownerEmail || '',
        isSharedWithMe: true,
        myRole,
        stats: {
          totalItems,
          packedItems,
          unpackedItems,
          packingProgress
        }
      });
    }
  } catch (err) {
    // collectionGroup query requires an index in some environments; ignore if index not set
  }

  return lists;
}

module.exports = {
  isValidEmail,
  checkUserListAccess,
  sendInvitation,
  getReceivedInvitations,
  getSentInvitationsForList,
  acceptInvitation,
  rejectInvitation,
  cancelInvitation,
  getListMembers,
  updateMemberRole,
  removeMember,
  leaveList,
  getSharedListsForUser
};

