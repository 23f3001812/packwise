import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radii, Shadows } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
} from '../../services/notificationHistoryService';

export default function NotificationCenterScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All'); // 'All' | 'Leave-Behind' | 'Trips'

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (err) {
      console.warn('Failed to load notifications:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } finally {
      setRefreshing(false);
    }
  };

  const handleNotificationPress = async (item) => {
    // Mark as read
    if (!item.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === item.notificationId ? { ...n, isRead: true } : n))
      );
      markNotificationAsRead(item.notificationId).catch(() => {});
    }

    // Navigate to related list if present
    if (item.relatedListId) {
      router.push(`/lists/${item.relatedListId}`);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await markAllNotificationsAsRead();
    } catch (err) {
      console.warn('Mark all read error:', err.message);
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear Notifications',
      'Are you sure you want to delete all in-app notification history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllNotifications();
              setNotifications([]);
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to clear history.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteOne = async (notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.notificationId !== notificationId));
    try {
      await deleteNotification(notificationId);
    } catch (err) {
      console.warn('Delete notification error:', err.message);
    }
  };

  // Filtered list
  const filteredNotifications = useMemo(() => {
    if (selectedFilter === 'Leave-Behind') {
      return notifications.filter((n) => n.type === 'leave_behind');
    }
    if (selectedFilter === 'Trips') {
      return notifications.filter((n) => n.type === 'trip_reminder' || n.type === 'packing_reminder');
    }
    return notifications;
  }, [notifications, selectedFilter]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getIconForType = (type) => {
    switch (type) {
      case 'leave_behind':
        return { name: 'warning-outline', color: '#B45309', bg: '#FEF3C7' };
      case 'trip_reminder':
        return { name: 'airplane-outline', color: '#0369A1', bg: '#E0F2FE' };
      case 'packing_reminder':
        return { name: 'checkbox-outline', color: '#059669', bg: '#D1FAE5' };
      default:
        return { name: 'notifications-outline', color: Colors.primary, bg: Colors.primarySurface };
    }
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const now = new Date();
      const diffMs = now - d;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Notifications"
        showBack={true}
        rightAction={
          notifications.length > 0 ? (
            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={handleMarkAllRead} style={styles.headerBtn}>
                  <Ionicons name="checkmark-done" size={20} color={Colors.primary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleClearAll} style={styles.headerBtn}>
                <Ionicons name="trash-outline" size={18} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      <View style={styles.container}>
        {/* Filter Segment Tabs */}
        <View style={styles.filterRow}>
          {['All', 'Leave-Behind', 'Trips'].map((tab) => {
            const isSelected = selectedFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterTab, isSelected && styles.filterTabActive]}
                onPress={() => setSelectedFilter(tab)}
              >
                <Text
                  style={[styles.filterTabText, isSelected && styles.filterTabTextActive]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
        >
          {loading && !refreshing ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading notifications...</Text>
            </View>
          ) : filteredNotifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="notifications-outline" size={44} color={Colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptySubtitle}>
                {selectedFilter === 'All'
                  ? 'You are all caught up! Geofence leave-behind alerts and trip reminders will appear here.'
                  : `No ${selectedFilter.toLowerCase()} notifications recorded.`}
              </Text>
            </View>
          ) : (
            filteredNotifications.map((notif) => {
              const iconConfig = getIconForType(notif.type);
              return (
                <TouchableOpacity
                  key={notif.notificationId}
                  activeOpacity={0.8}
                  style={[
                    styles.notificationCard,
                    Shadows.card,
                    !notif.isRead && styles.notificationCardUnread,
                  ]}
                  onPress={() => handleNotificationPress(notif)}
                >
                  {/* Left Icon Pill */}
                  <View style={[styles.typeIconPill, { backgroundColor: iconConfig.bg }]}>
                    <Ionicons name={iconConfig.name} size={18} color={iconConfig.color} />
                  </View>

                  {/* Body Content */}
                  <View style={styles.contentCol}>
                    <View style={styles.cardTopRow}>
                      <Text style={styles.notifTitle} numberOfLines={1}>
                        {notif.title}
                      </Text>
                      <Text style={styles.timeText}>{formatTimestamp(notif.createdAt)}</Text>
                    </View>

                    <Text style={styles.notifBody}>{notif.body}</Text>

                    {/* Missing items pills if any */}
                    {Array.isArray(notif.missingItems) && notif.missingItems.length > 0 && (
                      <View style={styles.missingPillsRow}>
                        {notif.missingItems.slice(0, 3).map((item, idx) => (
                          <View key={idx} style={styles.itemPill}>
                            <Text style={styles.itemPillText}>{item}</Text>
                          </View>
                        ))}
                        {notif.missingItems.length > 3 && (
                          <View style={styles.itemPill}>
                            <Text style={styles.itemPillText}>
                              +{notif.missingItems.length - 3} more
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {notif.relatedListId && (
                      <Text style={styles.viewChecklistPrompt}>Tap to open checklist →</Text>
                    )}
                  </View>

                  {/* Right Actions: Unread dot & delete */}
                  <View style={styles.cardRightCol}>
                    {!notif.isRead && <View style={styles.unreadDot} />}
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteOne(notif.notificationId)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close" size={16} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
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
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBtn: {
    padding: 6,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.backgroundSecondary,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 90,
  },
  centerContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notificationCardUnread: {
    backgroundColor: '#F8FAFC',
    borderColor: '#BAE6FD',
  },
  typeIconPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contentCol: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  notifBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  missingPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 6,
  },
  itemPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radii.sm,
  },
  itemPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  viewChecklistPrompt: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 2,
  },
  cardRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingLeft: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginBottom: 8,
  },
  deleteBtn: {
    padding: 2,
  },
});

