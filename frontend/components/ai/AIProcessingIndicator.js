import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radii, Shadows } from '../../constants/theme';

const STAGES = [
  { label: 'Analyzing destination and trip details...', icon: 'location-outline' },
  { label: 'Checking OpenWeatherMap forecast...', icon: 'cloud-outline' },
  { label: 'Consulting Google Gemini packing models...', icon: 'sparkles-outline' },
  { label: 'Curating personalized recommendations...', icon: 'checkbox-outline' },
];

export const AIProcessingIndicator = ({ destination, onCancel = null }) => {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStageIndex((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev));
    }, 2200);

    return () => clearInterval(timer);
  }, []);

  const currentStage = STAGES[stageIndex];

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Animated / Primary Spinner */}
        <View style={styles.spinnerCircle}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Crafting Your Checklist</Text>
        <Text style={styles.subtitle}>
          Tailoring packing essentials for {destination || 'your destination'}
        </Text>

        {/* Current Pipeline Step */}
        <View style={styles.stageBox}>
          <Ionicons name={currentStage.icon} size={20} color={Colors.primary} style={styles.stageIcon} />
          <Text style={styles.stageText}>{currentStage.label}</Text>
        </View>

        {/* Progress Dots */}
        <View style={styles.dotsRow}>
          {STAGES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i <= stageIndex ? styles.activeDot : styles.inactiveDot
              ]}
            />
          ))}
        </View>

        {onCancel && (
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton} activeOpacity={0.7}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Shadows.md,
  },
  spinnerCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  stageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: '100%',
    marginBottom: 20,
  },
  stageIcon: {
    marginRight: 12,
  },
  stageText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  inactiveDot: {
    backgroundColor: '#D1D5DB',
  },
  cancelButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});

export default AIProcessingIndicator;

