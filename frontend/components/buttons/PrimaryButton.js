import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { Radii } from '../../constants/theme';

export const PrimaryButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon = null,
  style = {},
  textStyle = {},
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        isDisabled && styles.buttonDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={Colors.textInverse} size="small" />
      ) : (
        <View style={styles.contentRow}>
          <Text style={[styles.text, isDisabled && styles.textDisabled, textStyle]}>
            {title}
          </Text>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  buttonDisabled: {
    backgroundColor: '#8E9BAE',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: Colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  textDisabled: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  iconContainer: {
    marginLeft: 8,
  },
});

export default PrimaryButton;

