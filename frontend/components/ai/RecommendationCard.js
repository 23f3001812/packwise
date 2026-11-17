import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radii, Shadows } from '../../constants/theme';

export const RecommendationCard = ({
  item,
  isSelected,
  onToggleSelect,
  onQuantityChange,
  onRemove,
  style = {},
}) => {
  const isHighPriority = item.priority === 'High';
  const isLowPriority = item.priority === 'Low';

  const handleDecrement = (e) => {
    e.stopPropagation?.();
    if (item.quantity > 1) {
      onQuantityChange(item.quantity - 1);
    }
  };

  const handleIncrement = (e) => {
    e.stopPropagation?.();
    onQuantityChange(item.quantity + 1);
  };

  const handleRemove = (e) => {
    e.stopPropagation?.();
    onRemove();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onToggleSelect}
      style={[
        styles.card,
        isSelected ? styles.cardSelected : styles.cardUnselected,
        style,
      ]}
    >
      <View style={styles.mainRow}>
        {/* Checkbox */}
        <TouchableOpacity
          onPress={onToggleSelect}
          style={[
            styles.checkbox,
            isSelected ? styles.checkboxChecked : styles.checkboxUnchecked,
          ]}
          activeOpacity={0.7}
        >
          {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
        </TouchableOpacity>

        {/* Item Info */}
        <View style={styles.infoCol}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.itemName, !isSelected && styles.itemNameUnselected]}
              numberOfLines={2}
            >
              {item.name}
            </Text>
          </View>

          {/* Badges Row */}
          <View style={styles.badgesRow}>
            {/* Category Pill */}
            <View style={styles.categoryPill}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>

            {/* Priority Badge */}
            <View
              style={[
                styles.priorityBadge,
                isHighPriority
                  ? styles.priorityHigh
                  : isLowPriority
                  ? styles.priorityLow
                  : styles.priorityMedium,
              ]}
            >
              <Text
                style={[
                  styles.priorityText,
                  isHighPriority
                    ? styles.priorityTextHigh
                    : isLowPriority
                    ? styles.priorityTextLow
                    : styles.priorityTextMedium,
                ]}
              >
                {item.priority}
              </Text>
            </View>

            {/* Weather Badge */}
            {item.weatherRelated && (
              <View style={styles.weatherBadge}>
                <Ionicons name="rainy-outline" size={11} color="#2563EB" style={{ marginRight: 3 }} />
                <Text style={styles.weatherBadgeText}>Weather</Text>
              </View>
            )}

            {/* Essential Badge */}
            {item.essential && (
              <View style={styles.essentialBadge}>
                <Ionicons name="star" size={10} color="#D97706" style={{ marginRight: 3 }} />
                <Text style={styles.essentialBadgeText}>Essential</Text>
              </View>
            )}
          </View>

          {/* Reason text */}
          {item.reason ? (
            <Text style={styles.reasonText} numberOfLines={2}>
              {item.reason}
            </Text>
          ) : null}
        </View>

        {/* Right Actions: Quantity Stepper & Remove */}
        <View style={styles.actionsCol}>
          {/* Quantity Stepper */}
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              onPress={handleDecrement}
              style={[styles.stepBtn, item.quantity <= 1 && styles.stepBtnDisabled]}
              disabled={item.quantity <= 1}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={12} color={item.quantity <= 1 ? '#D1D5DB' : Colors.textPrimary} />
            </TouchableOpacity>

            <Text style={styles.qtyText}>{item.quantity}</Text>

            <TouchableOpacity
              onPress={handleIncrement}
              style={styles.stepBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={12} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Remove Button */}
          <TouchableOpacity
            onPress={handleRemove}
            style={styles.removeBtn}
            activeOpacity={0.6}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={15} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    ...Shadows.sm,
  },
  cardSelected: {
    borderColor: '#D1D5DB',
  },
  cardUnselected: {
    borderColor: '#F3F4F6',
    backgroundColor: '#FAFAFA',
    opacity: 0.7,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
  },
  checkboxUnchecked: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  infoCol: {
    flex: 1,
    marginRight: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  itemNameUnselected: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  priorityBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  priorityHigh: {
    backgroundColor: '#FEE2E2',
  },
  priorityMedium: {
    backgroundColor: '#EFF6FF',
  },
  priorityLow: {
    backgroundColor: '#F3F4F6',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  priorityTextHigh: {
    color: '#DC2626',
  },
  priorityTextMedium: {
    color: '#2563EB',
  },
  priorityTextLow: {
    color: '#6B7280',
  },
  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  weatherBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  essentialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  essentialBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#B45309',
  },
  reasonText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  actionsCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 56,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: Radii.full,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  stepBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  stepBtnDisabled: {
    backgroundColor: '#F3F4F6',
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    minWidth: 20,
    textAlign: 'center',
  },
  removeBtn: {
    padding: 4,
    marginTop: 8,
  },
});

export default RecommendationCard;

