import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { Radii, Shadows } from '../../constants/theme';
import { PackingProgressCard } from '../../components/cards/PackingProgressCard';
import { QuickActionCard } from '../../components/cards/QuickActionCard';
import { EventCard } from '../../components/cards/EventCard';
import { checkBackendHealth } from '../../services/api';

export default function HomeScreen() {
  const router = useRouter();
  const { user, userProfile } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [backendStatus, setBackendStatus] = useState({
    checked: false,
    connected: false,
    loading: true,
    url: '',
    message: '',
  });

  // Display user's name or fallback
  const displayName = userProfile?.name || user?.displayName || 'Traveler';

  // Check backend health on mount
  useEffect(() => {
    testBackendConnection();
  }, []);

  const testBackendConnection = async () => {
    setBackendStatus((prev) => ({ ...prev, loading: true }));
    const result = await checkBackendHealth();
    setBackendStatus({
      checked: true,
      connected: result.connected,
      loading: false,
      url: result.url,
      message: result.connected
        ? `Backend Online (v${result.data?.version || '1.0.0'})`
        : 'Backend Offline / Unreachable',
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await testBackendConnection();
    setRefreshing(false);
  };

  const showMilestoneAlert = (featureName, targetMilestone) => {
    Alert.alert(
      featureName,
      `This feature is part of ${targetMilestone}. In Milestone 1, the core architecture, authentication, and database foundation are active!`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {/* Top Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.greetingContainer}>
            <TouchableOpacity
              onPress={() => Alert.alert('Menu', 'Side drawer menu will be integrated in future milestone.')}
              style={styles.menuButton}
              activeOpacity={0.7}
            >
              <Ionicons name="menu-outline" size={26} color={Colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.nameHeader}>
              <Text style={styles.greetingText}>
                Hello, {displayName}! 👋
              </Text>
              <Text style={styles.subGreetingText}>
                Ready for your next adventure?
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => showMilestoneAlert('Notifications', 'Milestone 5 (Leave-Behind Alerts & Reminders)')}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
            <View style={styles.unreadBadge} />
          </TouchableOpacity>
        </View>

        {/* Packing Progress Card */}
        <View style={styles.progressSection}>
          <PackingProgressCard
            title="Your Packing Progress"
            progressPercent={72}
          />
        </View>

        {/* 2x2 Quick Actions Grid */}
        <View style={styles.gridSection}>
          <View style={styles.gridRow}>
            <QuickActionCard
              title="New Checklist"
              subtitle="✨ Create"
              iconName="checkbox-outline"
              iconColor={Colors.primary}
              style={styles.gridCard}
              onPress={() => showMilestoneAlert('AI Checklist Generator', 'Milestone 2 (Gemini AI Checklist)')}
            />

            <QuickActionCard
              title="My Bags"
              subtitle="📦 Organize"
              iconName="briefcase-outline"
              iconColor={Colors.primary}
              style={styles.gridCard}
              onPress={() => router.push('/(tabs)/storage')}
            />
          </View>

          <View style={styles.gridRow}>
            <QuickActionCard
              title="Groups"
              subtitle="👥 Share"
              iconName="people-outline"
              iconColor={Colors.primary}
              style={styles.gridCard}
              onPress={() => router.push('/(tabs)/groups')}
            />

            <QuickActionCard
              title="Reminders"
              subtitle="⏰ Set"
              iconName="time-outline"
              iconColor={Colors.primary}
              style={styles.gridCard}
              onPress={() => showMilestoneAlert('Trip Reminders', 'Milestone 5 (Geofencing & Alerts)')}
            />
          </View>
        </View>

        {/* Upcoming Events Section */}
        <View style={styles.eventsSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <TouchableOpacity
              onPress={() => showMilestoneAlert('Events Calendar', 'Milestone 4 (Trip & Schedule Management)')}
            >
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          <EventCard
            title="Trip to Shimla"
            dates="Apr 27 - May 1 • 5 days"
            onPress={() => showMilestoneAlert('Trip Details', 'Milestone 2 (AI Checklist & Packing Details)')}
          />
        </View>

        {/* Backend Connectivity Diagnostic Status Pill */}
        <TouchableOpacity
          style={[
            styles.diagnosticPill,
            backendStatus.connected
              ? styles.diagnosticPillOnline
              : styles.diagnosticPillOffline,
          ]}
          onPress={testBackendConnection}
          activeOpacity={0.8}
        >
          {backendStatus.loading ? (
            <ActivityIndicator size="small" color={Colors.textSecondary} style={{ marginRight: 8 }} />
          ) : (
            <View
              style={[
                styles.diagnosticDot,
                { backgroundColor: backendStatus.connected ? Colors.success : Colors.danger },
              ]}
            />
          )}
          <Text style={styles.diagnosticText}>
            {backendStatus.loading
              ? 'Checking PackWise Express Backend...'
              : backendStatus.message}
          </Text>
          <Ionicons
            name="refresh-outline"
            size={16}
            color={Colors.textSecondary}
            style={{ marginLeft: 6 }}
          />
        </TouchableOpacity>
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
    paddingTop: 12,
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nameHeader: {
    flex: 1,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  subGreetingText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
  progressSection: {
    marginBottom: 20,
  },
  gridSection: {
    marginBottom: 24,
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridCard: {
    flex: 1,
  },
  eventsSection: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  diagnosticPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radii.full,
    borderWidth: 1,
    marginTop: 8,
  },
  diagnosticPillOnline: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  diagnosticPillOffline: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  diagnosticDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  diagnosticText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});

