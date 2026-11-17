import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  FontAwesome,
  Feather,
} from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

/**
 * Intelligent icon name fallback dictionary.
 * Resolves legacy or cross-library icon names to guaranteed valid vector icons.
 */
const ICON_CORRECTIONS = {
  // Common misattributions between Ionicons and MaterialCommunityIcons
  'bag-suitcase-outline': { family: 'ionicons', name: 'briefcase-outline' },
  'bag-suitcase': { family: 'material-community', name: 'bag-suitcase' },
  'handbag': { family: 'material-community', name: 'purse' },
  'handbag-outline': { family: 'material-community', name: 'purse-outline' },
  'luggage': { family: 'material-community', name: 'bag-suitcase' },
  'alarm': { family: 'ionicons', name: 'alarm-outline' },
  'bell': { family: 'ionicons', name: 'notifications-outline' },
  'gear': { family: 'ionicons', name: 'settings-outline' },
  'user': { family: 'ionicons', name: 'person-outline' },
  'users': { family: 'ionicons', name: 'people-outline' },
  'home': { family: 'ionicons', name: 'home-outline' },
  'trash': { family: 'ionicons', name: 'trash-outline' },
  'pencil': { family: 'ionicons', name: 'pencil-outline' },
  'edit': { family: 'ionicons', name: 'pencil-outline' },
  'search': { family: 'ionicons', name: 'search-outline' },
  'check': { family: 'ionicons', name: 'checkmark' },
  'close': { family: 'ionicons', name: 'close' },
  'plus': { family: 'ionicons', name: 'add' },
};

/**
 * Reusable, resilient AppIcon component.
 * Prevents question mark (?) glyphs on Android/iOS by validating and providing
 * visually identical fallbacks when icon names are mismatched or unsupported.
 */
export const AppIcon = ({
  name,
  family = 'ionicons',
  size = 20,
  color = Colors.textPrimary,
  style = {},
  accessibilityLabel,
}) => {
  if (!name || typeof name !== 'string') {
    return <View style={[{ width: size, height: size }, style]} />;
  }

  // Check if there is an explicit alias or cross-library correction
  let targetFamily = family.toLowerCase();
  let targetName = name;

  if (ICON_CORRECTIONS[name]) {
    targetFamily = ICON_CORRECTIONS[name].family;
    targetName = ICON_CORRECTIONS[name].name;
  }

  const a11yProps = accessibilityLabel
    ? { accessibilityLabel, accessibilityRole: 'image' }
    : { importantForAccessibility: 'no', accessibilityElementsHidden: true };

  switch (targetFamily) {
    case 'material-community':
    case 'materialcommunityicons':
      return (
        <MaterialCommunityIcons
          name={targetName}
          size={size}
          color={color}
          style={style}
          {...a11yProps}
        />
      );

    case 'material':
    case 'materialicons':
      return (
        <MaterialIcons
          name={targetName}
          size={size}
          color={color}
          style={style}
          {...a11yProps}
        />
      );

    case 'fontawesome':
      return (
        <FontAwesome
          name={targetName}
          size={size}
          color={color}
          style={style}
          {...a11yProps}
        />
      );

    case 'feather':
      return (
        <Feather
          name={targetName}
          size={size}
          color={color}
          style={style}
          {...a11yProps}
        />
      );

    case 'ionicons':
    default:
      return (
        <Ionicons
          name={targetName}
          size={size}
          color={color}
          style={style}
          {...a11yProps}
        />
      );
  }
};

export default AppIcon;

