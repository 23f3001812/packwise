import React, { useState, useEffect, useCallback } from 'react';
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
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { Radii, Shadows } from '../../constants/theme';
import { PackingProgressCard } from '../../components/cards/PackingProgressCard';
import { QuickActionCard } from '../../components/cards/QuickActionCard';
import { EventCard } from '../../components/cards/EventCard';
import { checkBackendHealth } from '../../services/api';
import { fetchDashboardSummary } from '../../services/packingService';
import { useUnreadNotifications } from '../../hooks/useUnreadNotifications';

export default function HomeScreen() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const unreadNotificationsCount = useUnreadNotifications(user?.uid);

  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    hasData: false,
    totalLists: 0,
    totalItems: 0,
    totalPacked: 0,
    remainingItems: 0,
    overallProgress: 0,
    upcomingTrip: null,
    recentLists: [],
  });

  const [backendStatus, setBackendStatus] = useState({
    checked: false,
    connected: false,
    loading: true,
    url: '',
    message: '',
  });

  // Display user's name or fallback
  const displayName = userProfile?.name || user?.displayName || 'Traveler';

  const loadDashboard = async () => {
    try {
      const summary = await fetchDashboardSummary();
      setDashboardData(summary);
    } catch (err) {
      console.warn('Dashboard summary load notice:', err.message);
    }
  };

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

  useEffect(() => {
    testBackendConnection();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([testBackendConnection(), loadDashboard()]);
    setRefreshing(false);
  };

  const showMilestoneAlert = (featureName, targetMilestone) => {
    Alert.alert(
      featureName,
      `This feature is part of ${targetMilestone}. In Milestone 2, core packing checklists, unpacking mode, and intelligent storage management are fully functional!`,
      [{ text: 'OK' }]
    );
  };

  const progressSubtitle = dashboardData.hasData
    ? `${dashboardData.totalPacked} of ${dashboardData.totalItems} items packed across ${dashboardData.totalLists} ${dashboardData.totalLists === 1 ? 'list' : 'lists'}`
    : 'No packing lists yet — create one below';

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
              onPress={() => router.push('/lists')}
              style={styles.menuButton}
              activeOpacity={0.7}
            >
              <Ionicons name="menu-outline" size={26} color={Colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.nameHeader}>
              <Text style={styles.greetingText}>
                Hello, {displayName}
              </Text>
              <Text style={styles.subGreetingText}>
                Ready for your next adventure?
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => router.push('/notifications')}
            activeOpacity={0.7}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
            {unreadNotificationsCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Packing Progress Card (Real Data) */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/lists')}
          style={styles.progressSection}
        >
          <PackingProgressCard
            title={dashboardData.hasData ? 'Overall Packing Progress' : 'Start Packing'}
            progressPercent={dashboardData.overallProgress || 0}
            subtitle={progressSubtitle}
          />
        </TouchableOpacity>

        {/* AI Smart Packing Banner */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/ai')}
          style={styles.aiBanner}
        >
          <View style={styles.aiBannerIcon}>
            <Ionicons name="sparkles" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.aiBannerContent}>
            <View style={styles.aiBannerBadgeRow}>
              <Text style={styles.aiBannerTitle}>AI Packing Assistant</Text>
              <View style={styles.aiNewPill}>
                <Text style={styles.aiNewPillText}>Gemini AI</Text>
              </View>
            </View>
            <Text style={styles.aiBannerSub}>
              Weather-aware checklists tailored to your destination
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
        </TouchableOpacity>

        {/* 2x2 Quick Actions Grid */}
        <View style={styles.gridSection}>
          <View style={styles.gridRow}>
            <QuickActionCard
              title="New Checklist"
              subtitle="Create"
              iconName="checkbox-outline"
              iconColor={Colors.primary}
              style={styles.gridCard}
              onPress={() => router.push('/lists/create')}
            />

            <QuickActionCard
              title="My Bags"
              subtitle="Organize"
              iconName="briefcase-outline"
              iconColor={Colors.primary}
              style={styles.gridCard}
              onPress={() => router.push('/(tabs)/storage')}
            />
          </View>

          <View style={styles.gridRow}>
            <QuickActionCard
              title="Packing Lists"
              subtitle="View All"
              iconName="list-outline"
              iconColor={Colors.primary}
              style={styles.gridCard}
              onPress={() => router.push('/lists')}
            />

            <QuickActionCard
              title="Reminders"
              subtitle="Alerts"
              iconName="alarm-outline"
              iconColor={Colors.primary}
              style={styles.gridCard}
              onPress={() => router.push('/reminders')}
            />
          </View>
        </View>

        {/* Upcoming Events / Lists Section */}
        <View style={styles.eventsSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Upcoming Trips</Text>
            <TouchableOpacity onPress={() => router.push('/lists')}>
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          {dashboardData.upcomingTrip ? (
            <EventCard
              title={dashboardData.upcomingTrip.eventName}
              dates={`${dashboardData.upcomingTrip.destination}${dashboardData.upcomingTrip.startDate ? ` • ${dashboardData.upcomingTrip.startDate}` : ''}`}
              onPress={() => router.push(`/lists/${dashboardData.upcomingTrip.listId}`)}
            />
          ) : (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/lists/create')}
              style={[styles.emptyTripCard, Shadows.card]}
            >
              <View style={styles.emptyTripIcon}>
                <Ionicons name="airplane-outline" size={24} color={Colors.primary} />
              </View>
              <View style={styles.emptyTripTextContainer}>
                <Text style={styles.emptyTripTitle}>No upcoming trips planned</Text>
                <Text style={styles.emptyTripSubtitle}>
                  Tap here to create a new packing checklist
                </Text>
              </View>
              <Ionicons name="add-circle-outline" size={22} color={Colors.primary} />
            </TouchableOpacity>
          )}
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
    paddingBottom: 96,
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
    top: 5,
    right: 5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
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
  emptyTripCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTripIcon: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emptyTripTextContainer: {
    flex: 1,
  },
  emptyTripTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  emptyTripSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
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
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Shadows.sm,
  },
  aiBannerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  aiBannerContent: {
    flex: 1,
    marginRight: 8,
  },
  aiBannerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  aiBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  aiNewPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  aiNewPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
    textTransform: 'uppercase',
  },
  aiBannerSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
});
