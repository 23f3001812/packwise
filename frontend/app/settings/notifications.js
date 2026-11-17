import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radii, Shadows } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { checkLocationPermissions, requestLocationPermissions } from '../../services/geofenceService';
import {
  getNotificationPermissionsStatus,
  requestNotificationPermissions,
} from '../../services/notificationService';
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from '../../services/notificationHistoryService';

export default function NotificationSettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    leaveBehindAlertsEnabled: true,
    tripRemindersEnabled: true,
    packingRemindersEnabled: true,
    soundEnabled: true,
  });

  const [permissions, setPermissions] = useState({
    foregroundLocation: false,
    backgroundLocation: false,
    notifications: false,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [prefs, locPerm, notifPerm] = await Promise.all([
        fetchNotificationPreferences().catch(() => ({
          leaveBehindAlertsEnabled: true,
          tripRemindersEnabled: true,
          packingRemindersEnabled: true,
          soundEnabled: true,
        })),
        checkLocationPermissions(),
        getNotificationPermissionsStatus(),
      ]);

      if (prefs) setPreferences(prefs);
      setPermissions({
        foregroundLocation: locPerm.foregroundGranted,
        backgroundLocation: locPerm.backgroundGranted,
        notifications: notifPerm,
      });
    } catch (err) {
      console.warn('Failed to load settings:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTogglePreference = async (key) => {
    const nextVal = !preferences[key];
    const updated = { ...preferences, [key]: nextVal };
    setPreferences(updated);

    try {
      await updateNotificationPreferences({ [key]: nextVal });
    } catch (err) {
      setPreferences(preferences);
      Alert.alert('Error', 'Failed to save preference.');
    }
  };

  const handleRequestLocation = async () => {
    const res = await requestLocationPermissions();
    setPermissions((prev) => ({
      ...prev,
      foregroundLocation: res.foregroundGranted,
      backgroundLocation: res.backgroundGranted,
    }));
    if (!res.foregroundGranted) {
      Alert.alert(
        'Location Permission Denied',
        'To enable geofenced leave-behind packing alerts, please grant location access in device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  const handleRequestNotifications = async () => {
    const granted = await requestNotificationPermissions();
    setPermissions((prev) => ({ ...prev, notifications: granted }));
    if (!granted) {
      Alert.alert(
        'Notification Permission Denied',
        'To receive leave-behind reminders and trip alerts, please grant notification access in device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Notification Settings" showBack={true} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Notification Settings" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Device Permissions Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Device Permissions</Text>
          <Text style={styles.sectionDescription}>
            PackWise requires device permissions to deliver real-time geofenced departure alerts and scheduled trip reminders.
          </Text>

          {/* Foreground Location Status */}
          <View style={[styles.card, Shadows.card]}>
            <View style={styles.permRow}>
              <View style={styles.permIconCol}>
                <Ionicons
                  name={permissions.foregroundLocation ? 'checkmark-circle' : 'alert-circle'}
                  size={22}
                  color={permissions.foregroundLocation ? Colors.success : Colors.warning}
                />
              </View>
              <View style={styles.permTextCol}>
                <Text style={styles.permTitle}>Foreground Location</Text>
                <Text style={styles.permSub}>
                  {permissions.foregroundLocation
                    ? 'Granted • Required to capture coordinates for saved places.'
                    : 'Not Granted • GPS location is disabled.'}
                </Text>
              </View>
              {!permissions.foregroundLocation && (
                <TouchableOpacity style={styles.grantBtn} onPress={handleRequestLocation}>
                  <Text style={styles.grantBtnText}>Enable</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Background Location Status */}
            <View style={[styles.permRow, styles.borderTop]}>
              <View style={styles.permIconCol}>
                <Ionicons
                  name={permissions.backgroundLocation ? 'checkmark-circle' : 'alert-circle'}
                  size={22}
                  color={permissions.backgroundLocation ? Colors.success : Colors.warning}
                />
              </View>
              <View style={styles.permTextCol}>
                <Text style={styles.permTitle}>Background Geofencing</Text>
                <Text style={styles.permSub}>
                  {permissions.backgroundLocation
                    ? 'Granted • PackWise can detect when you exit saved places even when the app is closed.'
                    : 'Requires "Allow all the time" location access in device settings.'}
                </Text>
              </View>
              {!permissions.backgroundLocation && (
                <TouchableOpacity
                  style={styles.grantBtn}
                  onPress={() => Linking.openSettings()}
                >
                  <Text style={styles.grantBtnText}>Settings</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Notification Permission Status */}
            <View style={[styles.permRow, styles.borderTop]}>
              <View style={styles.permIconCol}>
                <Ionicons
                  name={permissions.notifications ? 'checkmark-circle' : 'alert-circle'}
                  size={22}
                  color={permissions.notifications ? Colors.success : Colors.warning}
                />
              </View>
              <View style={styles.permTextCol}>
                <Text style={styles.permTitle}>Push / Local Notifications</Text>
                <Text style={styles.permSub}>
                  {permissions.notifications
                    ? 'Granted • Instant alerts will be delivered to your status bar.'
                    : 'Not Granted • Alerts cannot pop up on your screen.'}
                </Text>
              </View>
              {!permissions.notifications && (
                <TouchableOpacity style={styles.grantBtn} onPress={handleRequestNotifications}>
                  <Text style={styles.grantBtnText}>Enable</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Alert Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Alert Types & Preferences</Text>
          <Text style={styles.sectionDescription}>
            Customize which types of reminders PackWise sends you.
          </Text>

          <View style={[styles.card, Shadows.card]}>
            {/* Leave-Behind Alerts Toggle */}
            <View style={styles.prefRow}>
              <View style={styles.prefTextCol}>
                <Text style={styles.prefTitle}>Leave-Behind Alerts</Text>
                <Text style={styles.prefSub}>
                  Alert you when exiting a saved location if essential belongings remain unpacked.
                </Text>
              </View>
              <Switch
                value={preferences.leaveBehindAlertsEnabled}
                onValueChange={() => handleTogglePreference('leaveBehindAlertsEnabled')}
                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                thumbColor={preferences.leaveBehindAlertsEnabled ? Colors.primary : '#F3F4F6'}
              />
            </View>

            {/* Trip Reminders Toggle */}
            <View style={[styles.prefRow, styles.borderTop]}>
              <View style={styles.prefTextCol}>
                <Text style={styles.prefTitle}>Upcoming Trip Reminders</Text>
                <Text style={styles.prefSub}>
                  Receive countdown notifications 1 or 3 days before scheduled trips start.
                </Text>
              </View>
              <Switch
                value={preferences.tripRemindersEnabled}
                onValueChange={() => handleTogglePreference('tripRemindersEnabled')}
                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                thumbColor={preferences.tripRemindersEnabled ? Colors.primary : '#F3F4F6'}
              />
            </View>

            {/* Packing Reminders Toggle */}
            <View style={[styles.prefRow, styles.borderTop]}>
              <View style={styles.prefTextCol}>
                <Text style={styles.prefTitle}>Packing Progress Reminders</Text>
                <Text style={styles.prefSub}>
                  Remind you to complete incomplete checklists before travel departure.
                </Text>
              </View>
              <Switch
                value={preferences.packingRemindersEnabled}
                onValueChange={() => handleTogglePreference('packingRemindersEnabled')}
                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                thumbColor={preferences.packingRemindersEnabled ? Colors.primary : '#F3F4F6'}
              />
            </View>

            {/* Sound Toggle */}
            <View style={[styles.prefRow, styles.borderTop]}>
              <View style={styles.prefTextCol}>
                <Text style={styles.prefTitle}>Notification Sound</Text>
                <Text style={styles.prefSub}>
                  Play audible alert sound and vibration on Android when notifications arrive.
                </Text>
              </View>
              <Switch
                value={preferences.soundEnabled}
                onValueChange={() => handleTogglePreference('soundEnabled')}
                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                thumbColor={preferences.soundEnabled ? Colors.primary : '#F3F4F6'}
              />
            </View>
          </View>
        </View>

        {/* Android Geofencing Notice */}
        <View style={styles.noteCard}>
          <Ionicons name="information-circle-outline" size={18} color="#0369A1" />
          <Text style={styles.noteText}>
            Note: On physical Android devices, background geofencing requires an Expo Development Build for full native background monitoring. When testing in Expo Go, use the "Test Exit Alert" button on any reminder card to verify the exact leave-behind notification trigger.
          </Text>
        </View>
      </ScrollView>
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
    paddingTop: 14,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 10,
  },
  section: {
    marginBottom: 22,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 10,
    lineHeight: 16,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  permIconCol: {
    marginRight: 10,
  },
  permTextCol: {
    flex: 1,
    marginRight: 10,
  },
  permTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  permSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  grantBtn: {
    backgroundColor: Colors.primarySurface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
  },
  grantBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  prefTextCol: {
    flex: 1,
    marginRight: 14,
  },
  prefTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  prefSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  noteCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1,
    borderRadius: Radii.md,
    padding: 14,
    gap: 10,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#0369A1',
    lineHeight: 17,
  },
});

