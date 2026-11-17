import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radii } from '../../constants/theme';

export const PackingItemCard = ({
  item,
  isUnpackingMode = false,
  isReadOnly = false,
  onToggleStatus,
  onEdit,
  onDelete,
  style = {},
}) => {
  // Determine checked state based on active mode
  const isChecked = isUnpackingMode ? item.isUnpacked : item.isPacked;
  const isDisabled = isReadOnly || (isUnpackingMode && !item.isPacked);

  // Priority color styling
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'High':
        return { bg: '#FEF2F2', text: Colors.danger };
      case 'Low':
        return { bg: '#F3F4F6', text: Colors.textSecondary };
      case 'Medium':
      default:
        return { bg: '#FFFBEB', text: Colors.warning };
    }
  };

  const priorityStyle = getPriorityStyle(item.priority);

  return (
    <View style={[styles.card, isChecked && styles.cardChecked, isDisabled && styles.cardDisabled, style]}>
      {/* Checkbox Trigger */}
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={isDisabled}
        onPress={() => onToggleStatus(item)}
        style={styles.checkboxTouch}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <View
          style={[
            styles.checkbox,
            isChecked && styles.checkboxActive,
            isDisabled && styles.checkboxDisabled,
          ]}
        >
          {isChecked && <Ionicons name="checkmark" size={16} color={Colors.textInverse} />}
        </View>
      </TouchableOpacity>

      {/* Main Info */}
      <View style={styles.contentSection}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.itemName,
              isChecked && styles.itemNameChecked,
              isDisabled && styles.itemNameDisabled,
            ]}
            numberOfLines={1}
          >
            {item.itemName}
          </Text>
          {item.quantity > 1 && (
            <View style={styles.quantityBadge}>
              <Text style={styles.quantityText}>×{item.quantity}</Text>
            </View>
          )}
        </View>

        {/* Badges Row: Category, Priority, Container */}
        <View style={styles.badgesRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{item.category || 'Other'}</Text>
          </View>

          {item.priority && (
            <View style={[styles.priorityBadge, { backgroundColor: priorityStyle.bg }]}>
              <Text style={[styles.priorityBadgeText, { color: priorityStyle.text }]}>
                {item.priority}
              </Text>
            </View>
          )}

          {item.containerName ? (
            <View style={styles.containerBadge}>
              <MaterialCommunityIcons name="bag-suitcase-outline" size={11} color={Colors.primary} />
              <Text style={styles.containerBadgeText} numberOfLines={1}>
                {item.containerName}
              </Text>
            </View>
          ) : null}
        </View>

        {item.notes ? (
          <Text style={styles.notesText} numberOfLines={2}>
            {item.notes}
          </Text>
        ) : null}

        {item.createdByName ? (
          <Text style={styles.authorText} numberOfLines={1}>
            Added by {item.createdByName}
          </Text>
        ) : null}

        {isUnpackingMode && !item.isPacked && (
          <Text style={styles.disabledNotice}>
            Not packed during trip
          </Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsColumn}>
        {onEdit && !isReadOnly && (
          <TouchableOpacity
            onPress={() => onEdit(item)}
            style={styles.actionBtn}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="pencil-outline" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
        {onDelete && !isReadOnly && (
          <TouchableOpacity
            onPress={() => onDelete(item)}
            style={styles.actionBtn}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="trash-outline" size={16} color={Colors.danger} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  cardChecked: {
    backgroundColor: '#FAFBFD',
    borderColor: '#E2E8F0',
  },
  cardDisabled: {
    opacity: 0.55,
  },
  checkboxTouch: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxDisabled: {
    borderColor: '#D1D5DB',
    backgroundColor: '#F3F4F6',
  },
  contentSection: {
    flex: 1,
    paddingRight: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  itemNameChecked: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  itemNameDisabled: {
    color: Colors.textMuted,
  },
  quantityBadge: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.xs,
    marginLeft: 6,
  },
  quantityText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  categoryBadge: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radii.xs,
  },
  categoryBadgeText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.xs,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  containerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primarySurface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.xs,
    maxWidth: 120,
  },
  containerBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
  },
  notesText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  disabledNotice: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  authorText: {
    fontSize: 11,
    color: '#0369A1',
    marginTop: 3,
  },
  actionsColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    padding: 6,
  },
});

export default PackingItemCard;

