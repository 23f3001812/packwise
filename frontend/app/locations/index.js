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
  fetchLocations,
  toggleLocationActive,
  deleteLocation,
} from '../../services/locationService';
import { syncGeofences } from '../../services/geofenceService';

export default function LocationsScreen() {
  const router = useRouter();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const data = await fetchLocations();
      setLocations(data);
      // Synchronize active geofences in the background
      syncGeofences(data).catch(() => {});
    } catch (err) {
      console.warn('Failed to load locations:', err.message);
      Alert.alert('Error', err.message || 'Could not load saved locations.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadLocations();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await fetchLocations();
      setLocations(data);
      syncGeofences(data).catch(() => {});
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggle = async (location) => {
    const nextState = !location.isActive;
    // Optimistic UI update
    setLocations((prev) =>
      prev.map((l) => (l.locationId === location.locationId ? { ...l, isActive: nextState } : l))
    );

    try {
      await toggleLocationActive(location.locationId, nextState);
    } catch (err) {
      // Rollback
      setLocations((prev) =>
        prev.map((l) => (l.locationId === location.locationId ? { ...l, isActive: !nextState } : l))
      );
      Alert.alert('Error', err.message || 'Failed to update location status.');
    }
  };

  const handleDelete = (location) => {
    Alert.alert(
      'Delete Location',
      `Are you sure you want to delete "${location.name}"? Any active leave-behind reminders for this location will be deactivated.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLocation(location.locationId);
              setLocations((prev) => prev.filter((l) => l.locationId !== location.locationId));
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete location.');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (loc) => {
    router.push({
      pathname: '/locations/create',
      params: {
        editMode: 'true',
        locationId: loc.locationId,
        name: loc.name,
        address: loc.address || '',
        latitude: String(loc.latitude),
        longitude: String(loc.longitude),
        radius: String(loc.radius || 200),
        isActive: String(loc.isActive !== false),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Saved Locations"
        showBack={true}
        rightAction={
          <TouchableOpacity
            style={styles.addHeaderBtn}
            onPress={() => router.push('/locations/create')}
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
          <Ionicons name="navigate-outline" size={20} color={Colors.primary} style={styles.infoIcon} />
          <View style={styles.infoTextCol}>
            <Text style={styles.infoTitle}>Geofenced Places</Text>
            <Text style={styles.infoSubtitle}>
              PackWise monitors these locations to alert you if you leave essential belongings behind.
            </Text>
          </View>
        </View>

        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading saved places...</Text>
          </View>
        ) : locations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="location-outline" size={44} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No Saved Locations</Text>
            <Text style={styles.emptySubtitle}>
              Add places like Home, College, Hotel or Office to set up leave-behind alerts.
            </Text>
            <PrimaryButton
              title="Add Location +"
              onPress={() => router.push('/locations/create')}
              style={styles.emptyBtn}
            />
          </View>
        ) : (
          locations.map((loc) => (
            <View key={loc.locationId} style={[styles.locationCard, Shadows.card]}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.nameRow}>
                  <View style={[styles.iconPill, !loc.isActive && styles.iconPillInactive]}>
                    <Ionicons
                      name="location"
                      size={18}
                      color={loc.isActive ? Colors.primary : Colors.textMuted}
                    />
                  </View>
                  <View style={styles.nameCol}>
                    <Text style={styles.locationName}>{loc.name}</Text>
                    {loc.address ? (
                      <Text style={styles.locationAddress} numberOfLines={1}>
                        {loc.address}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* Active Toggle Switch */}
                <Switch
                  value={loc.isActive}
                  onValueChange={() => handleToggle(loc)}
                  trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                  thumbColor={loc.isActive ? Colors.primary : '#F3F4F6'}
                />
              </View>

              {/* Coordinates & Radius Badges */}
              <View style={styles.metaRow}>
                <View style={styles.badge}>
                  <Ionicons name="radio-outline" size={12} color={Colors.textSecondary} />
                  <Text style={styles.badgeText}>{loc.radius || 200}m radius</Text>
                </View>

                <View style={styles.badge}>
                  <Ionicons name="compass-outline" size={12} color={Colors.textSecondary} />
                  <Text style={styles.badgeText}>
                    {Number(loc.latitude).toFixed(4)}, {Number(loc.longitude).toFixed(4)}
                  </Text>
                </View>
              </View>

              {/* Card Footer Actions */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() =>
                    router.push({
                      pathname: '/reminders/create',
                      params: { prefillLocationId: loc.locationId },
                    })
                  }
                >
                  <Ionicons name="alarm-outline" size={14} color={Colors.primary} />
                  <Text style={styles.actionBtnText}>Add Reminder</Text>
                </TouchableOpacity>

                <View style={styles.rightActions}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleEdit(loc)}
                    accessibilityLabel="Edit location"
                  >
                    <Ionicons name="pencil-outline" size={17} color={Colors.textSecondary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleDelete(loc)}
                    accessibilityLabel="Delete location"
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
      {locations.length > 0 && (
        <View style={styles.floatingBottom}>
          <PrimaryButton
            title="Add Location +"
            onPress={() => router.push('/locations/create')}
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
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
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
    color: '#0369A1',
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
  locationCard: {
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
    marginBottom: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  iconPillInactive: {
    backgroundColor: Colors.backgroundSecondary,
  },
  nameCol: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  locationAddress: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primarySurface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.full,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  rightActions: {
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

