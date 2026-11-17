import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radii, Shadows } from '../../constants/theme';

export const ContainerCard = ({
  container,
  onPress,
  onEdit,
  onDelete,
  style = {},
}) => {
  const getContainerVisuals = (type) => {
    switch (type) {
      case 'Backpack':
        return { icon: 'bag-personal', color: '#1E293B', bg: '#F1F5F9' };
      case 'Handbag':
        return { icon: 'purse', color: '#BE185D', bg: '#FDF2F8' };
      case 'Duffel bag':
        return { icon: 'bag-carry-on', color: '#047857', bg: '#ECFDF5' };
      case 'Storage box':
        return { icon: 'package-variant-closed', color: '#D97706', bg: '#FFFBEB' };
      case 'Suitcase':
      default:
        return { icon: 'bag-suitcase', color: '#2563EB', bg: '#EFF6FF' };
    }
  };

  const visuals = getContainerVisuals(container.containerType);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.card, Shadows.card, style]}
    >
      <View style={[styles.iconWrapper, { backgroundColor: visuals.bg }]}>
        <MaterialCommunityIcons name={visuals.icon} size={28} color={visuals.color} />
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.name} numberOfLines={1}>
          {container.containerName}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.typeText}>{container.containerType || 'Suitcase'}</Text>
          {container.capacity && (
            <>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.capacityText}>{container.capacity}</Text>
            </>
          )}
        </View>
        <Text style={styles.itemCountText}>
          {container.itemCount || 0} {container.itemCount === 1 ? 'item' : 'items'} packed
        </Text>
      </View>

      <View style={styles.actionsRow}>
        {onEdit && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onEdit(container);
            }}
            style={styles.actionBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="pencil-outline" size={17} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onDelete(container);
            }}
            style={styles.actionBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={17} color={Colors.danger} />
          </TouchableOpacity>
        )}
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} style={{ marginLeft: 4 }} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  iconWrapper: {
    width: 50,
    height: 50,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoSection: {
    flex: 1,
    paddingRight: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  dot: {
    fontSize: 12,
    color: Colors.textMuted,
    marginHorizontal: 5,
  },
  capacityText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  itemCountText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    padding: 4,
  },
});

export default ContainerCard;

