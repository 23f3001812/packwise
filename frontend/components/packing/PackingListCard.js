import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radii, Shadows } from '../../constants/theme';

export const PackingListCard = ({
  list,
  onPress,
  onEdit,
  onDelete,
  style = {},
}) => {
  const stats = list.stats || {
    totalItems: 0,
    packedItems: 0,
    unpackedItems: 0,
    packingProgress: 0,
    unpackingProgress: 0,
  };

  const isUnpackingMode = list.mode === 'unpacking';
  const progressPercent = isUnpackingMode ? stats.unpackingProgress : stats.packingProgress;
  const isComplete = progressPercent === 100 && stats.totalItems > 0;

  // Format dates
  const formatDateRange = () => {
    if (list.startDate && list.endDate) {
      return `${list.startDate} to ${list.endDate}`;
    }
    if (list.startDate) {
      return `Starts ${list.startDate}`;
    }
    return null;
  };

  const dateText = formatDateRange();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.card, Shadows.card, style]}
    >
      <View style={styles.topRow}>
        <View style={styles.headerInfo}>
          <Text style={styles.eventName} numberOfLines={1}>
            {list.eventName}
          </Text>
          <View style={styles.destinationRow}>
            <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.destinationText} numberOfLines={1}>
              {list.destination}
            </Text>
            {list.eventType && (
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{list.eventType}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.actionsRow}>
          {onEdit && !list.isSharedWithMe && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              style={styles.iconAction}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="pencil-outline" size={17} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
          {onDelete && !list.isSharedWithMe && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              style={styles.iconAction}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={17} color={Colors.danger} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Collaboration Indicator Pill */}
      {list.isSharedWithMe ? (
        <View style={styles.sharedBadge}>
          <Ionicons name="people" size={12} color="#1D4ED8" style={{ marginRight: 4 }} />
          <Text style={styles.sharedBadgeText}>Shared With Me • {list.myRole || 'Editor'}</Text>
        </View>
      ) : list.isCollaborative ? (
        <View style={styles.collabBadge}>
          <Ionicons name="people" size={12} color={Colors.primary} style={{ marginRight: 4 }} />
          <Text style={styles.collabBadgeText}>Collaborative Trip</Text>
        </View>
      ) : null}

      {dateText && (
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.dateText}>{dateText}</Text>
        </View>
      )}

      {/* Progress & Stats Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>
            {isUnpackingMode ? 'Unpacked' : 'Packed'}: {isUnpackingMode ? stats.unpackedItems : stats.packedItems}/{stats.totalItems} items
          </Text>
          <Text style={[styles.progressPercent, isComplete && styles.progressPercentComplete]}>
            {progressPercent}%
          </Text>
        </View>

        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progressPercent}%` },
              isComplete && styles.progressBarFillComplete,
            ]}
          />
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={[styles.modeBadge, isUnpackingMode && styles.modeBadgeUnpacking]}>
          <Ionicons
            name={isUnpackingMode ? 'cube-outline' : 'bag-suitcase-outline'}
            size={12}
            color={isUnpackingMode ? '#0284C7' : Colors.primary}
          />
          <Text style={[styles.modeBadgeText, isUnpackingMode && styles.modeBadgeTextUnpacking]}>
            {isUnpackingMode ? 'Unpacking Mode' : 'Packing Mode'}
          </Text>
        </View>

        <View style={styles.viewDetailsRow}>
          <Text style={styles.viewDetailsText}>View Checklist</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  headerInfo: {
    flex: 1,
    paddingRight: 8,
  },
  eventName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  destinationText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  typeBadge: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.sm,
    marginLeft: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconAction: {
    padding: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  progressSection: {
    marginTop: 10,
    marginBottom: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  progressPercentComplete: {
    color: Colors.success,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Radii.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
  },
  progressBarFillComplete: {
    backgroundColor: Colors.success,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primarySurface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  modeBadgeUnpacking: {
    backgroundColor: '#E0F2FE',
  },
  modeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  modeBadgeTextUnpacking: {
    color: '#0369A1',
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  sharedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  collabBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  collabBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});

export default PackingListCard;

