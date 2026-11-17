import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radii } from '../../constants/theme';
import { PackingItemCard } from './PackingItemCard';

export const CategorySection = ({
  category,
  items,
  isUnpackingMode,
  isReadOnly = false,
  onToggleStatus,
  onEditItem,
  onDeleteItem,
  initialExpanded = true,
  style = {},
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  const completedCount = items.filter((i) =>
    isUnpackingMode ? i.isUnpacked : i.isPacked
  ).length;

  return (
    <View style={[styles.container, style]}>
      {/* Category Section Header */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setIsExpanded(!isExpanded)}
        style={styles.header}
      >
        <View style={styles.titleRow}>
          <Text style={styles.categoryName}>{category}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {completedCount}/{items.length}
            </Text>
          </View>
        </View>

        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={Colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Collapsible Item Cards */}
      {isExpanded && (
        <View style={styles.itemsList}>
          {items.map((item) => (
            <PackingItemCard
              key={item.itemId}
              item={item}
              isUnpackingMode={isUnpackingMode}
              isReadOnly={isReadOnly}
              onToggleStatus={onToggleStatus}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  countBadge: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  countText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  itemsList: {
    paddingLeft: 2,
  },
});

export default CategorySection;

