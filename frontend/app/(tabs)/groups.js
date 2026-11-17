import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radii, Shadows } from '../../constants/theme';
import { InvitationCard } from '../../components/collaboration/InvitationCard';
import {
  fetchSharedLists,
  acceptInvitation,
  rejectInvitation
} from '../../services/collaborationService';
import { useAuth } from '../../context/AuthContext';
import { usePendingInvitations } from '../../hooks/usePendingInvitations';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';

export default function GroupsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { invitations, pendingCount } = usePendingInvitations(user?.email);

  const [activeTab, setActiveTab] = useState('shared'); // 'shared' | 'invitations'
  const [sharedLists, setSharedLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSharedLists = async () => {
    try {
      setLoading(true);
      const lists = await fetchSharedLists();
      // Exclude any lists owned by the user and deduplicate by listId
      const filtered = (lists || []).filter(
        (l) => l.userId !== user?.uid && l.ownerId !== user?.uid
      );
      const unique = Array.from(new Map(filtered.map((l) => [l.listId, l])).values());
      setSharedLists(unique);
    } catch (err) {
      console.warn('Failed to load shared lists:', err.message);
    } finally {
      setLoading(false);
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
          loadSharedLists();
        },
        (err) => {
          console.warn('[Groups] Realtime listener notice:', err.message);
        }
      );
    } catch (e) {
      console.warn('[Groups] Realtime listener setup notice:', e.message);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.uid]);

  useFocusEffect(
    useCallback(() => {
      loadSharedLists();
    }, [user?.uid])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSharedLists();
    setRefreshing(false);
  };

  const handleAcceptInvite = async (invitationId) => {
    try {
      const res = await acceptInvitation(invitationId);
      await loadSharedLists();
      setActiveTab('shared');
      Alert.alert(
        'Invitation Accepted',
        `You have joined "${res.listName || 'the trip'}".`,
        [
          {
            text: 'View Trip',
            onPress: () => router.push(`/lists/${res.listId}`)
          },
          { text: 'OK' }
        ]
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to accept invitation.');
    }
  };

  const handleRejectInvite = async (invitationId) => {
    try {
      await rejectInvitation(invitationId);
      Alert.alert('Invitation Declined', 'The invitation was declined.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to decline invitation.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Trip Collaboration</Text>
          <Text style={styles.headerSubtitle}>Shared packing lists & trip invitations</Text>
        </View>

        {/* Tab Switcher: Shared Trips vs Invitations */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            onPress={() => {
              setActiveTab('shared');
              loadSharedLists();
            }}
            style={[styles.tabBtn, activeTab === 'shared' && styles.tabBtnActive]}
            activeOpacity={0.7}
          >
            <Ionicons
              name="people-outline"
              size={16}
              color={activeTab === 'shared' ? Colors.textInverse : Colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[styles.tabText, activeTab === 'shared' && styles.tabTextActive]}
            >
              Shared Trips ({sharedLists.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('invitations')}
            style={[styles.tabBtn, activeTab === 'invitations' && styles.tabBtnActive]}
            activeOpacity={0.7}
          >
            <Ionicons
              name="mail-outline"
              size={16}
              color={activeTab === 'invitations' ? Colors.textInverse : Colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[styles.tabText, activeTab === 'invitations' && styles.tabTextActive]}
            >
              Invitations
            </Text>
            {pendingCount > 0 && (
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
        >
          {activeTab === 'shared' ? (
            /* SHARED TRIPS TAB */
            loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading shared lists...</Text>
              </View>
            ) : sharedLists.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="people-outline" size={32} color={Colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>No Shared Trips Yet</Text>
                <Text style={styles.emptySubtitle}>
                  When other PackWise users invite you to their packing checklists, they will appear here in real-time.
                </Text>
              </View>
            ) : (
              sharedLists.map((item) => (
                <TouchableOpacity
                  key={item.listId}
                  style={[styles.sharedCard, Shadows.card]}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/lists/${item.listId}`)}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderInfo}>
                      <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
                        {item.eventName}
                      </Text>
                      <View style={styles.destRow}>
                        <Ionicons name="location-outline" size={13} color={Colors.textSecondary} style={{ marginRight: 3 }} />
                        <Text style={styles.destText}>{item.destination}</Text>
                      </View>
                    </View>

                    {/* Role Pill */}
                    <View style={styles.rolePill}>
                      <Text style={styles.roleText}>{item.myRole || 'Editor'}</Text>
                    </View>
                  </View>

                  {/* Owner Row */}
                  <View style={styles.ownerRow}>
                    <Ionicons name="person-circle-outline" size={15} color={Colors.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={styles.ownerText}>
                      Owner: {item.ownerName || item.ownerEmail || 'Collaborator'}
                    </Text>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressRow}>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${item.stats?.packingProgress || 0}%` }
                        ]}
                      />
                    </View>
                    <Text style={styles.progressPercent}>
                      {item.stats?.packingProgress || 0}%
                    </Text>
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.itemsCount}>
                      {item.stats?.packedItems || 0} of {item.stats?.totalItems || 0} items packed
                    </Text>
                    <View style={styles.viewRow}>
                      <Text style={styles.viewText}>Open Checklist</Text>
                      <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )
          ) : (
            /* INVITATIONS TAB */
            invitations.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="mail-open-outline" size={32} color={Colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>No Pending Invitations</Text>
                <Text style={styles.emptySubtitle}>
                  You're all caught up! New collaboration invitations sent to {user?.email} will appear here.
                </Text>
              </View>
            ) : (
              invitations.map((inv) => (
                <InvitationCard
                  key={inv.invitationId}
                  invitation={inv}
                  onAccept={handleAcceptInvite}
                  onReject={handleRejectInvite}
                />
              ))
            )
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  container: {
    flex: 1
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: Radii.full,
    padding: 4
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radii.full
  },
  tabBtnActive: {
    backgroundColor: Colors.primary
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary
  },
  tabTextActive: {
    color: '#FFFFFF'
  },
  badgeCount: {
    marginLeft: 6,
    backgroundColor: Colors.danger,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: Radii.full
  },
  badgeCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 96
  },
  centerContainer: {
    paddingVertical: 40,
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 30
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19
  },
  sharedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  cardHeaderInfo: {
    flex: 1,
    minWidth: 0,
    marginRight: 8
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  destRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },
  destText: {
    fontSize: 12,
    color: Colors.textSecondary
  },
  rolePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: Radii.full
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
    textTransform: 'uppercase'
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  ownerText: {
    fontSize: 12,
    color: Colors.textSecondary
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6'
  },
  itemsCount: {
    fontSize: 12,
    color: Colors.textSecondary
  },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  viewText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginRight: 2
  }
});
