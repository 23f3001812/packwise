import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
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
import { PrimaryButton } from '../../components/buttons/PrimaryButton';
import {
  fetchReminders,
  toggleReminderEnabled,
  deleteReminder,
} from '../../services/reminderService';
import { simulateGeofenceExit } from '../../services/geofenceService';

export default function RemindersScreen() {
  const router = useRouter();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [testingId, setTestingId] = useState(null);

  const loadReminders = async () => {
    try {
      setLoading(true);
      const data = await fetchReminders();
      setReminders(data);
    } catch (err) {
      console.warn('Failed to load reminders:', err.message);
      Alert.alert('Error', err.message || 'Could not load reminders.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadReminders();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await fetchReminders();
      setReminders(data);
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggle = async (reminder) => {
    const nextState = !reminder.isEnabled;
    setReminders((prev) =>
      prev.map((r) => (r.reminderId === reminder.reminderId ? { ...r, isEnabled: nextState } : r))
    );

    try {
      await toggleReminderEnabled(reminder.reminderId, nextState);
    } catch (err) {
      setReminders((prev) =>
        prev.map((r) => (r.reminderId === reminder.reminderId ? { ...r, isEnabled: !nextState } : r))
      );
      Alert.alert('Error', err.message || 'Failed to update reminder status.');
    }
  };

  const handleDelete = (reminder) => {
    Alert.alert(
      'Delete Reminder',
      `Delete leave-behind reminder for "${reminder.locationName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReminder(reminder.reminderId);
              setReminders((prev) => prev.filter((r) => r.reminderId !== reminder.reminderId));
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete reminder.');
            }
          },
        },
      ]
    );
  };

  // Test Exit Simulation
  const handleTestExit = async (reminder) => {
    setTestingId(reminder.reminderId);
    try {
      const result = await simulateGeofenceExit(reminder.locationId);

      if (result.triggered) {
        Alert.alert(
          'Leave-Behind Alert Triggered',
          `PackWise detected you leaving ${result.locationName || reminder.locationName}.\n\nMissing items to pack:\n• ${result.alerts[0]?.missingItems?.join('\n• ')}\n\nA notification was also delivered.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'All Items Packed',
          `You are leaving ${reminder.locationName}, but all items in your checklist have already been marked packed. No unnecessary notification was triggered.`,
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      Alert.alert('Simulation Error', err.message || 'Failed to test exit alert.');
    } finally {
      setTestingId(null);
    }
  };

  const handleEdit = (r) => {
    router.push({
      pathname: '/reminders/create',
      params: {
        editMode: 'true',
        reminderId: r.reminderId,
        locationId: r.locationId,
        packingListIds: JSON.stringify(r.packingListIds || []),
        itemIds: JSON.stringify(r.itemIds || []),
        customMessage: r.customMessage || '',
        onlyUnpacked: String(r.onlyUnpacked !== false),
        isEnabled: String(r.isEnabled !== false),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Leave-Behind Alerts"
        showBack={true}
        rightAction={
          <TouchableOpacity
            style={styles.addHeaderBtn}
            onPress={() => router.push('/reminders/create')}
          >
            <Ionicons name="add" size={24} color={Colors.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="alarm-outline" size={20} color="#B45309" style={styles.infoIcon} />
          <View style={styles.infoTextCol}>
            <Text style={styles.infoTitle}>Smart Leave-Behind Reminders</Text>
            <Text style={styles.infoSubtitle}>
              When you exit a saved location, PackWise verifies if essential belongings are still unpacked and notifies you before you get too far!
            </Text>
          </View>
        </View>

        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading reminders...</Text>
          </View>
        ) : reminders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="notifications-off-outline" size={44} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No Reminders Configured</Text>
            <Text style={styles.emptySubtitle}>
              Create a smart reminder to alert you if you leave home, office, or your hotel without essentials like your laptop, charger, or wallet.
            </Text>
            <PrimaryButton
              title="Create Reminder +"
              onPress={() => router.push('/reminders/create')}
              style={styles.emptyBtn}
            />
          </View>
        ) : (
          reminders.map((r) => (
            <View key={r.reminderId} style={[styles.reminderCard, Shadows.card]}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.locationTag}>
                  <Ionicons name="location" size={14} color={Colors.primary} />
                  <Text style={styles.locationTagText}>{r.locationName}</Text>
                </View>

                {/* Enable / Disable Switch */}
                <Switch
                  value={r.isEnabled}
                  onValueChange={() => handleToggle(r)}
                  trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                  thumbColor={r.isEnabled ? Colors.primary : '#F3F4F6'}
                />
              </View>

              {/* Message / Details */}
              <Text style={styles.reminderTitle}>
                {r.customMessage || `Alert on departure from ${r.locationName}`}
              </Text>

              {/* Linked Lists */}
              {Array.isArray(r.packingListNames) && r.packingListNames.length > 0 && (
                <View style={styles.metaRow}>
                  <Ionicons name="list-outline" size={13} color={Colors.textSecondary} />
                  <Text style={styles.metaText} numberOfLines={1}>
                    Lists: {r.packingListNames.join(', ')}
                  </Text>
                </View>
              )}

              {/* Badges Row */}
              <View style={styles.badgesRow}>
                <View style={[styles.badgePill, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="checkmark-circle-outline" size={12} color="#059669" />
                  <Text style={[styles.badgePillText, { color: '#065F46' }]}>
                    {r.onlyUnpacked ? 'Only unpacked items' : 'All items'}
                  </Text>
                </View>

                {Array.isArray(r.itemIds) && r.itemIds.length > 0 ? (
                  <View style={[styles.badgePill, { backgroundColor: '#F0F9FF' }]}>
                    <Text style={[styles.badgePillText, { color: '#0369A1' }]}>
                      {r.itemIds.length} specific {r.itemIds.length === 1 ? 'item' : 'items'}
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.badgePill, { backgroundColor: '#F0F9FF' }]}>
                    <Text style={[styles.badgePillText, { color: '#0369A1' }]}>All list items</Text>
                  </View>
                )}
              </View>

              {/* Card Footer Actions */}
              <View style={styles.cardFooter}>
                {/* Instant Simulation Button */}
                <TouchableOpacity
                  style={styles.testBtn}
                  onPress={() => handleTestExit(r)}
                  disabled={testingId === r.reminderId}
                  activeOpacity={0.7}
                >
                  {testingId === r.reminderId ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <Ionicons name="paper-plane-outline" size={13} color={Colors.primary} />
                  )}
                  <Text style={styles.testBtnText}>Test Exit Alert</Text>
                </TouchableOpacity>

                <View style={styles.rightIcons}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleEdit(r)}
                    accessibilityLabel="Edit reminder"
                  >
                    <Ionicons name="pencil-outline" size={17} color={Colors.textSecondary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleDelete(r)}
                    accessibilityLabel="Delete reminder"
                  >
                    <Ionicons name="trash-outline" size={17} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Floating Add Button */}
      {reminders.length > 0 && (
        <View style={styles.floatingBottom}>
          <PrimaryButton
            title="Create Reminder +"
            onPress={() => router.push('/reminders/create')}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 100,
  },
  addHeaderBtn: {
    padding: 6,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: 14,
    marginBottom: 16,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoTextCol: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  infoSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  centerContainer: {
    paddingVertical: 50,
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
    paddingVertical: 50,
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
    marginBottom: 20,
  },
  emptyBtn: {
    minWidth: 180,
  },
  reminderCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primarySurface,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  locationTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primarySurface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.full,
  },
  testBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 4,
  },
  floatingBottom: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
});

