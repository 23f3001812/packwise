import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radii, Shadows } from '../../constants/theme';

export const PackingProgressCard = ({
  title = 'Your Packing Progress',
  progressPercent = 72,
  subtitle = null,
  style = {},
}) => {
  const clampPercent = Math.min(100, Math.max(0, progressPercent));

  return (
    <View style={[styles.card, Shadows.card, style]}>
      <View style={styles.contentLeft}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.percentage}>{clampPercent}%</Text>

        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${clampPercent}%` },
            ]}
          />
        </View>

        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <View style={styles.suitcaseGraphicContainer}>
        <View style={styles.suitcaseCircle}>
          <MaterialCommunityIcons name="bag-suitcase" size={48} color="#60A5FA" />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.lg,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 140,
    overflow: 'hidden',
  },
  contentLeft: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '500',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  percentage: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textInverse,
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  progressBarBackground: {
    height: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: Radii.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.textInverse,
    borderRadius: Radii.full,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
  },
  suitcaseGraphicContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  suitcaseCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
});

export default PackingProgressCard;

