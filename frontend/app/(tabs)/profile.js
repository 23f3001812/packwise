import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { Radii, Shadows } from '../../constants/theme';
import { fetchSharedLists } from '../../services/collaborationService';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, userProfile, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [sharedTrips, setSharedTrips] = useState([]);
  const [loadingSharedTrips, setLoadingSharedTrips] = useState(false);

  const name = userProfile?.name || user?.displayName || 'PackWise Traveler';
  const email = user?.email || 'user@packwise.com';

  const loadSharedTrips = async () => {
    try {
      setLoadingSharedTrips(true);
      const lists = await fetchSharedLists();
      // Ensure only trips where user is collaborator (not owner) appear, and deduplicate
      const filtered = (lists || []).filter(
        (l) => l.userId !== user?.uid && l.ownerId !== user?.uid
      );
      const unique = Array.from(new Map(filtered.map((l) => [l.listId, l])).values());
      setSharedTrips(unique);
    } catch (err) {
      console.warn('[Profile] Failed to load shared trips:', err.message);
    } finally {
      setLoadingSharedTrips(false);
    }
  };

  // Real-time listener for shared lists membership changes
  useEffect(() => {
    if (!user?.uid || !db) return;
    let unsubscribe = null;
    try {
      const q = query(
        collection(db, 'packingLists'),
        where('memberIds', 'array-contains', user.uid)
      );
      unsubscribe = onSnapshot(
        q,
        () => {
          loadSharedTrips();
        },
        (err) => {
          console.warn('[Profile] Realtime listener notice:', err.message);
        }
      );
    } catch (e) {
      console.warn('[Profile] Realtime listener setup notice:', e.message);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.uid]);

  useFocusEffect(
    useCallback(() => {
      loadSharedTrips();
    }, [user?.uid])
  );

  const menuItems = [
    {
      id: '1',
      title: 'My Packing Lists',
      icon: 'list-outline',
      onPress: () => router.push('/lists'),
    },
    {
      id: '2',
      title: 'Saved Locations & Geofences',
      icon: 'location-outline',
      onPress: () => router.push('/locations'),
    },
    {
      id: '3',
      title: 'Leave-Behind Reminders',
      icon: 'alarm-outline',
      onPress: () => router.push('/reminders'),
    },
    {
      id: '4',
      title: 'Shared Trips & Collaboration',
      icon: 'people-outline',
      onPress: () => router.push('/(tabs)/groups'),
    },
    {
      id: '5',
      title: 'Notification & Location Settings',
      icon: 'settings-outline',
      onPress: () => router.push('/settings/notifications'),
    },
    {
      id: '6',
      title: 'Help & Support',
      icon: 'help-circle-outline',
      onPress: () => Alert.alert('Help & Support', 'PackWise user guide and FAQs.'),
    },
    {
      id: '7',
      title: 'About PackWise',
      icon: 'information-circle-outline',
      onPress: () =>
        Alert.alert(
          'About PackWise',
          'PackWise v1.0.0 (Milestone 5)\nAI-Powered Context-Aware Packing and Intelligent Item Management System with Geofencing and Real-Time Collaboration.'
        ),
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of PackWise?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            const result = await logout();
            setLoggingOut(false);
            if (result.success) {
              router.replace('/(auth)/login');
            } else {
              Alert.alert('Error', result.error || 'Failed to log out');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile & Settings</Text>
          <TouchableOpacity
            style={styles.gearButton}
            onPress={() => router.push('/settings/notifications')}
            accessibilityLabel="Settings"
          >
            <Ionicons name="settings-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* User Profile Card */}
          <View style={styles.userSection}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.userName}>{name}</Text>
            <Text style={styles.userEmail}>{email}</Text>
          </View>

          {/* Shared Trips Section */}
          <View style={styles.sharedSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="people" size={18} color={Colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.sectionHeaderTitle}>
                  Shared Trips {sharedTrips.length > 0 ? `(${sharedTrips.length})` : ''}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/groups')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {loadingSharedTrips && sharedTrips.length === 0 ? (
              <View style={styles.sharedLoading}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.sharedLoadingText}>Loading shared trips...</Text>
              </View>
            ) : sharedTrips.length === 0 ? (
              <View style={styles.emptySharedCard}>
                <Ionicons name="people-outline" size={24} color={Colors.textMuted} style={{ marginBottom: 6 }} />
                <Text style={styles.emptySharedTitle}>No Shared Trips</Text>
                <Text style={styles.emptySharedSub}>
                  When other travelers invite you to collaborate on packing lists, they will appear here in real-time.
                </Text>
              </View>
            ) : (
              sharedTrips.slice(0, 3).map((item) => (
                <TouchableOpacity
                  key={item.listId}
                  style={[styles.sharedTripCard, Shadows.card]}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/lists/${item.listId}`)}
                >
                  <View style={styles.sharedCardTop}>
                    <View style={styles.sharedCardInfo}>
                      <Text style={styles.sharedTripTitle} numberOfLines={1} ellipsizeMode="tail">
                        {item.eventName}
                      </Text>
                      <View style={styles.sharedDestRow}>
                        <Ionicons name="location-outline" size={13} color={Colors.textSecondary} style={{ marginRight: 4 }} />
                        <Text style={styles.sharedDestText} numberOfLines={1}>
                          {item.destination}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.rolePill}>
                      <Text style={styles.rolePillText}>{item.myRole || 'Editor'}</Text>
                    </View>
                  </View>

                  <View style={styles.sharedProgressRow}>
                    <View style={styles.sharedProgressTrack}>
                      <View
                        style={[
                          styles.sharedProgressFill,
                          { width: `${item.stats?.packingProgress || 0}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.sharedProgressPercent}>
                      {item.stats?.packingProgress || 0}%
                    </Text>
                  </View>

                  <View style={styles.sharedCardBottom}>
                    <Text style={styles.sharedItemsText}>
                      {item.stats?.packedItems || 0} of {item.stats?.totalItems || 0} items packed
                    </Text>
                    <View style={styles.sharedOpenRow}>
                      <Text style={styles.sharedOpenText}>Open</Text>
                      <Ionicons name="chevron-forward" size={13} color={Colors.primary} />
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Settings / Menu List */}
          <View style={[styles.menuCard, Shadows.card]}>
            {menuItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <TouchableOpacity
                  style={styles.menuRow}
                  activeOpacity={0.7}
                  onPress={item.onPress}
                >
                  <View style={styles.menuIconContainer}>
                    <Ionicons name={item.icon} size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  {item.id === '4' && sharedTrips.length > 0 && (
                    <View style={styles.menuBadge}>
                      <Text style={styles.menuBadgeText}>{sharedTrips.length}</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </TouchableOpacity>

                {index < menuItems.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>

          {/* Log Out Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={loggingOut}
            activeOpacity={0.8}
          >
            {loggingOut ? (
              <ActivityIndicator color={Colors.danger} size="small" />
            ) : (
              <Text style={styles.logoutText}>Log Out</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  gearButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 96,
  },
  userSection: {
    alignItems: 'center',
    marginBottom: 26,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  sharedSection: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  sharedLoading: {
    paddingVertical: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  sharedLoadingText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptySharedCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    alignItems: 'center',
  },
  emptySharedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  emptySharedSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  sharedTripCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
  },
  sharedCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sharedCardInfo: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  sharedTripTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  sharedDestRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sharedDestText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  rolePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D4ED8',
    textTransform: 'capitalize',
  },
  sharedProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sharedProgressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  sharedProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  sharedProgressPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    width: 32,
    textAlign: 'right',
  },
  sharedCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sharedItemsText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  sharedOpenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sharedOpenText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  menuBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginRight: 8,
  },
  menuBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  menuCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 6,
    marginBottom: 26,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuIconContainer: {
    width: 32,
    alignItems: 'flex-start',
  },
  menuTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: 48,
  },
  logoutButton: {
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    borderRadius: Radii.full,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.danger,
  },
});

