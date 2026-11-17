import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { Radii } from '../../constants/theme';

export const SecondaryButton = ({
  title,
  onPress,
  disabled = false,
  icon = null,
  variant = 'outlined', // 'outlined' | 'subtle'
  style = {},
  textStyle = {},
}) => {
  const isSubtle = variant === 'subtle';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        isSubtle ? styles.buttonSubtle : styles.buttonOutlined,
        disabled && styles.buttonDisabled,
        style,
      ]}
    >
      <View style={styles.contentRow}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text
          style={[
            styles.text,
            isSubtle ? styles.textSubtle : styles.textOutlined,
            textStyle,
          ]}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: Radii.full,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  buttonOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  buttonSubtle: {
    backgroundColor: Colors.backgroundSecondary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
  },
  textOutlined: {
    color: Colors.textPrimary,
  },
  textSubtle: {
    color: Colors.textPrimary,
  },
  iconContainer: {
    marginRight: 8,
  },
});

export default SecondaryButton;

