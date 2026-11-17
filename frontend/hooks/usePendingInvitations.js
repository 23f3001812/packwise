/**
 * PackWise Real-Time Pending Invitations Hook
 * Subscribes to collaborationInvitations for the current user's email.
 */

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

export function usePendingInvitations(userEmail) {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail || !db) {
      setInvitations([]);
      setLoading(false);
      return;
    }

    // Ensure Firebase Auth client is authenticated to prevent permission denied errors
    if (!auth?.currentUser) {
      setInvitations([]);
      setLoading(false);
      return;
    }

    const cleanEmail = (auth.currentUser.email || userEmail).trim().toLowerCase();
    let unsubscribe = null;

    try {
      const q = query(
        collection(db, 'collaborationInvitations'),
        where('inviteeEmail', '==', cleanEmail),
        where('status', '==', 'pending')
      );

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list = [];
          snapshot.forEach((docSnap) => {
            list.push({ invitationId: docSnap.id, ...docSnap.data() });
          });
          setInvitations(list);
          setLoading(false);
        },
        (err) => {
          if (err.code === 'permission-denied') {
            setInvitations([]);
            setLoading(false);
            return;
          }
          console.warn('[usePendingInvitations] Listener notice:', err.message);
          setLoading(false);
        }
      );
    } catch (e) {
      console.warn('[usePendingInvitations] Setup error:', e.message);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userEmail, auth?.currentUser?.email]);

  return {
    invitations,
    pendingCount: invitations.length,
    loading
  };
}

export default usePendingInvitations;

