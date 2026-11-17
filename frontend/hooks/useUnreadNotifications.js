/**
 * PackWise Unread Notifications Hook
 * Provides real-time listener for unread notifications count in Cloud Firestore.
 */

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

export function useUnreadNotifications(userId) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId || !db) {
      setUnreadCount(0);
      return;
    }

    // Ensure Firebase Auth client is authenticated for this user to avoid permission races
    if (!auth?.currentUser || auth.currentUser.uid !== userId) {
      setUnreadCount(0);
      return;
    }

    let unsubscribe = null;

    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('isRead', '==', false)
      );

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          setUnreadCount(snapshot.size);
        },
        (err) => {
          if (err.code === 'permission-denied') {
            setUnreadCount(0);
            return;
          }
          console.warn('[useUnreadNotifications] Listener notice:', err.message);
        }
      );
    } catch (err) {
      console.warn('[useUnreadNotifications] Setup notice:', err.message);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId, auth?.currentUser?.uid]);

  return unreadCount;
}

export default useUnreadNotifications;

