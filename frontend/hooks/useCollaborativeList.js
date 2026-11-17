/**
 * PackWise Real-Time Collaborative List Hook
 * Subscribes to Firestore onSnapshot listeners for list metadata, items, and members.
 * Automatically recalculates packing and unpacking progress when remote updates occur.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  doc,
  collection,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from '../services/firebase';

export function useCollaborativeList(listId, currentUserId) {
  const [listData, setListData] = useState(null);
  const [items, setItems] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!listId || !db || !auth?.currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubList = null;
    let unsubItems = null;
    let unsubMembers = null;

    try {
      // 1. Subscribe to List Document
      const listDocRef = doc(db, 'packingLists', listId);
      unsubList = onSnapshot(
        listDocRef,
        (snap) => {
          if (snap.exists()) {
            setListData({ listId: snap.id, ...snap.data() });
          } else {
            setListData(null);
            setError('Packing list not found.');
          }
          setLoading(false);
        },
        (err) => {
          console.warn('[useCollaborativeList] List listener notice:', err.message);
          setError(err.message);
          setLoading(false);
        }
      );

      // 2. Subscribe to Items Collection for this list
      const itemsQuery = query(collection(db, 'items'), where('listId', '==', listId));
      unsubItems = onSnapshot(
        itemsQuery,
        (snapshot) => {
          const loadedItems = [];
          snapshot.forEach((docSnap) => {
            loadedItems.push({ itemId: docSnap.id, ...docSnap.data() });
          });

          // Sort items: High priority first, then by createdAt/itemName
          const priorityWeight = { High: 3, Medium: 2, Low: 1 };
          loadedItems.sort((a, b) => {
            const pA = priorityWeight[a.priority] || 2;
            const pB = priorityWeight[b.priority] || 2;
            if (pB !== pA) return pB - pA;
            return (a.itemName || '').localeCompare(b.itemName || '');
          });

          setItems(loadedItems);
        },
        (err) => {
          console.warn('[useCollaborativeList] Items listener notice:', err.message);
        }
      );

      // 3. Subscribe to Members Subcollection
      const membersRef = collection(db, 'packingLists', listId, 'members');
      unsubMembers = onSnapshot(
        membersRef,
        (snapshot) => {
          const loadedMembers = [];
          snapshot.forEach((docSnap) => {
            loadedMembers.push({ userId: docSnap.id, ...docSnap.data() });
          });
          setMembers(loadedMembers);
        },
        (err) => {
          console.warn('[useCollaborativeList] Members listener notice:', err.message);
        }
      );
    } catch (e) {
      console.warn('[useCollaborativeList] Setup error:', e.message);
      setError(e.message);
      setLoading(false);
    }

    // Cleanup listeners on unmount or listId change
    return () => {
      if (unsubList) unsubList();
      if (unsubItems) unsubItems();
      if (unsubMembers) unsubMembers();
    };
  }, [listId, auth?.currentUser?.uid]);

  // Derived Access & Role
  const isOwner = Boolean(
    listData && (listData.userId === currentUserId || listData.ownerId === currentUserId)
  );

  let myRole = isOwner ? 'owner' : 'viewer';
  if (!isOwner && members.length > 0) {
    const mem = members.find((m) => m.userId === currentUserId);
    if (mem && mem.role) {
      myRole = mem.role;
    } else if (Array.isArray(listData?.memberIds) && listData.memberIds.includes(currentUserId)) {
      myRole = 'editor';
    }
  }

  // Real-time Progress Stats
  const totalCount = items.length;
  const packedCount = items.filter((i) => i.isPacked).length;
  const unpackedCount = items.filter((i) => i.isUnpacked).length;

  const packingPercent = totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0;
  const unpackingPercent = packedCount > 0 ? Math.round((unpackedCount / packedCount) * 100) : 0;

  return {
    listData,
    items,
    members,
    stats: {
      totalItems: totalCount,
      packedItems: packedCount,
      unpackedItems: unpackedCount,
      packingPercent,
      unpackingPercent
    },
    myRole,
    isOwner,
    isCollaborative: Boolean(listData?.isCollaborative || members.length > 0),
    loading,
    error
  };
}

export default useCollaborativeList;

