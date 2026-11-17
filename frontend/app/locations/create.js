import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radii, Shadows } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { PrimaryButton } from '../../components/buttons/PrimaryButton';
import { createLocation, updateLocation } from '../../services/locationService';

const PRESET_NAMES = ['Home', 'Office', 'College', 'Hotel', 'Airport', 'Gym'];
const RADIUS_OPTIONS = [100, 200, 500, 1000];

export default function CreateLocationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isEditMode = params.editMode === 'true';

  const [name, setName] = useState(params.name || '');
  const [address, setAddress] = useState(params.address || '');
  const [latitude, setLatitude] = useState(params.latitude || '');
  const [longitude, setLongitude] = useState(params.longitude || '');
  const [radius, setRadius] = useState(params.radius ? parseInt(params.radius, 10) : 200);
  const [isActive, setIsActive] = useState(params.isActive !== 'false');

  const [gettingLocation, setGettingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Capture current GPS coordinates
  const handleUseCurrentLocation = async () => {
    try {
      setGettingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'PackWise needs permission to access your device location so it can set up geofencing for this place.'
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setLatitude(String(lat));
      setLongitude(String(lng));

      // Attempt reverse geocoding to resolve street address
      try {
        const [geo] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (geo) {
          const parts = [geo.name, geo.street, geo.city, geo.region, geo.country].filter(Boolean);
          if (parts.length > 0) {
            setAddress(parts.join(', '));
          }
        }
      } catch (geoErr) {
        console.warn('Reverse geocode notice:', geoErr.message);
      }
    } catch (err) {
      console.warn('GPS error:', err.message);
      Alert.alert('GPS Notice', err.message || 'Could not fetch current GPS location.');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter a name for this location (e.g. Home, Hotel).');
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      Alert.alert('Invalid Latitude', 'Please provide a valid latitude coordinate (-90 to 90).');
      return;
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      Alert.alert('Invalid Longitude', 'Please provide a valid longitude coordinate (-180 to 180).');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        address: address.trim(),
        latitude: lat,
        longitude: lng,
        radius,
        isActive,
      };

      if (isEditMode) {
        await updateLocation(params.locationId, payload);
        Alert.alert('Updated', 'Saved location updated successfully.');
      } else {
        await createLocation(payload);
        Alert.alert('Success', 'Saved location created successfully.');
      }
      router.back();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save location.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title={isEditMode ? 'Edit Location' : 'Add Location'} showBack={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name Input */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Location Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Home, Office, Hotel Grand"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
          />

          {/* Preset Name Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsRow}>
            {PRESET_NAMES.map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[styles.presetChip, name === preset && styles.presetChipActive]}
                onPress={() => setName(preset)}
              >
                <Text style={[styles.presetChipText, name === preset && styles.presetChipTextActive]}>
                  {preset}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* GPS Capture Button */}
        <TouchableOpacity
          style={styles.gpsButton}
          onPress={handleUseCurrentLocation}
          disabled={gettingLocation}
          activeOpacity={0.8}
        >
          {gettingLocation ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="locate" size={18} color="#FFFFFF" />
          )}
          <Text style={styles.gpsButtonText}>
            {gettingLocation ? 'Acquiring GPS...' : 'Use Current GPS Position'}
          </Text>
        </TouchableOpacity>

        {/* Address Input */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Street Address / Area</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 123 Main Street, Sector 4, Mumbai"
            placeholderTextColor={Colors.textMuted}
            value={address}
            onChangeText={setAddress}
          />
        </View>

        {/* Coordinates Row */}
        <View style={styles.coordsRow}>
          <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Latitude *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 19.0760"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={latitude}
              onChangeText={setLatitude}
            />
          </View>

          <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Longitude *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 72.8777"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={longitude}
              onChangeText={setLongitude}
            />
          </View>
        </View>

        {/* Geofence Radius Selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Geofence Radius</Text>
          <Text style={styles.helperText}>
            Trigger alerts when you exit this distance from the location.
          </Text>
          <View style={styles.radiusRow}>
            {RADIUS_OPTIONS.map((rad) => {
              const isSelected = radius === rad;
              return (
                <TouchableOpacity
                  key={rad}
                  style={[styles.radiusChip, isSelected && styles.radiusChipActive]}
                  onPress={() => setRadius(rad)}
                >
                  <Text style={[styles.radiusChipText, isSelected && styles.radiusChipTextActive]}>
                    {rad}m{rad === 200 ? ' (Rec)' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Active Switch */}
        <View style={[styles.switchCard, Shadows.card]}>
          <View style={styles.switchTextCol}>
            <Text style={styles.switchTitle}>Enable Geofence Monitoring</Text>
            <Text style={styles.switchSub}>
              When enabled, PackWise monitors boundary exits for this place.
            </Text>
          </View>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
            thumbColor={isActive ? Colors.primary : '#F3F4F6'}
          />
        </View>

        {/* Submit Button */}
        <PrimaryButton
          title={isEditMode ? 'Update Location' : 'Save Location'}
          onPress={handleSubmit}
          loading={submitting}
          style={styles.submitBtn}
        />
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
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  presetsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radii.full,
    backgroundColor: Colors.backgroundSecondary,
    marginRight: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetChipActive: {
    backgroundColor: Colors.primarySurface,
    borderColor: Colors.primary,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  presetChipTextActive: {
    color: Colors.primary,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radii.md,
    height: 44,
    marginBottom: 16,
  },
  gpsButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  coordsRow: {
    flexDirection: 'row',
  },
  radiusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radii.md,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  radiusChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  radiusChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  radiusChipTextActive: {
    color: '#FFFFFF',
  },
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  switchTextCol: {
    flex: 1,
    marginRight: 10,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  switchSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  submitBtn: {
    marginTop: 8,
  },
});

