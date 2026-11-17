import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radii } from '../../constants/theme';

export const PackingModeToggle = ({ mode, onModeChange, style = {} }) => {
  const isPacking = mode === 'packing';

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onModeChange('packing')}
        style={[styles.segment, isPacking && styles.segmentActive]}
      >
        <Ionicons
          name="briefcase-outline"
          size={16}
          color={isPacking ? Colors.textInverse : Colors.textSecondary}
          style={styles.icon}
        />
        <Text style={[styles.label, isPacking && styles.labelActive]}>
          Packing
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onModeChange('unpacking')}
        style={[styles.segment, !isPacking && styles.segmentActive]}
      >
        <Ionicons
          name="cube-outline"
          size={16}
          color={!isPacking ? Colors.textInverse : Colors.textSecondary}
          style={styles.icon}
        />
        <Text style={[styles.label, !isPacking && styles.labelActive]}>
          Unpacking
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Radii.full,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radii.full,
  },
  segmentActive: {
    backgroundColor: Colors.primary,
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  labelActive: {
    color: Colors.textInverse,
    fontWeight: '700',
  },
});

export default PackingModeToggle;

