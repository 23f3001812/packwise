import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/colors';

export default function SplashScreen() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (user) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/onboarding');
        }
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [user, isLoading]);

  return (
    <View style={styles.container}>
      {/* Centered Brand Content */}
      <View style={styles.brandContainer}>
        <View style={styles.logoWrapper}>
          <View style={styles.logoIconContainer}>
            <MaterialCommunityIcons name="bag-suitcase" size={72} color={Colors.primary} />
            <View style={styles.planeIconBadge}>
              <Ionicons name="airplane" size={24} color={Colors.primary} />
            </View>
          </View>
        </View>

        <Text style={styles.brandName}>PackWise</Text>
        <Text style={styles.tagline}>Pack Smart. Travel Better.</Text>
      </View>

      {/* Subtle Bottom Travel Atmosphere & Loading Indicator */}
      <View style={styles.bottomContainer}>
        <ActivityIndicator size="small" color={Colors.primary} style={styles.loader} />
        <View style={styles.airplaneRow}>
          <Ionicons name="airplane-outline" size={22} color={Colors.textMuted} />
          <View style={styles.flightDottedLine} />
          <Ionicons name="location-outline" size={18} color={Colors.textMuted} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  brandContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    marginBottom: 20,
  },
  logoIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  planeIconBadge: {
    position: 'absolute',
    top: -6,
    right: -10,
    transform: [{ rotate: '45deg' }],
  },
  brandName: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  bottomContainer: {
    alignItems: 'center',
    width: '100%',
  },
  loader: {
    marginBottom: 24,
  },
  airplaneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 180,
    justifyContent: 'space-between',
    opacity: 0.6,
  },
  flightDottedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    marginHorizontal: 8,
  },
});

