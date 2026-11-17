import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radii, Shadows } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { WeatherSummaryCard } from '../../components/ai/WeatherSummaryCard';
import { RecommendationCard } from '../../components/ai/RecommendationCard';
import { PrimaryButton } from '../../components/buttons/PrimaryButton';
import { SecondaryButton } from '../../components/buttons/SecondaryButton';
import { createPackingList } from '../../services/packingService';
import { batchAddItemsToList } from '../../services/aiService';

export default function AIReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parse payload data
  let parsedData = { recommendations: [], generalTips: [], weather: null, tripSummary: '' };
  if (params.data) {
    try {
      parsedData = JSON.parse(params.data);
    } catch (e) {
      console.warn('Failed to parse AI review data:', e);
    }
  }

  const [recommendations, setRecommendations] = useState(
    parsedData.recommendations || []
  );
  const [filterMode, setFilterMode] = useState('All'); // 'All' | 'Weather' | 'Essential'
  const [saving, setSaving] = useState(false);

  const existingListId = params.listId || null;
  const eventName = params.eventName || `Trip to ${params.destination || 'Destination'}`;
  const destination = params.destination || parsedData.destination || '';
  const eventType = params.eventType || 'Vacation';
  const startDate = params.startDate || null;
  const endDate = params.endDate || null;

  // Filter items
  const filteredItems = useMemo(() => {
    if (filterMode === 'Weather') {
      return recommendations.filter((r) => r.weatherRelated);
    }
    if (filterMode === 'Essential') {
      return recommendations.filter((r) => r.essential);
    }
    return recommendations;
  }, [recommendations, filterMode]);

  const selectedCount = recommendations.filter((r) => r.selected).length;
  const allSelected = recommendations.length > 0 && selectedCount === recommendations.length;

  const handleToggleAll = () => {
    const nextState = !allSelected;
    setRecommendations((prev) =>
      prev.map((item) => ({ ...item, selected: nextState }))
    );
  };

  const handleToggleItem = (id) => {
    setRecommendations((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleQuantityChange = (id, newQty) => {
    setRecommendations((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, newQty) } : item
      )
    );
  };

  const handleRemoveItem = (id) => {
    setRecommendations((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveItems = async () => {
    const selectedItems = recommendations.filter((r) => r.selected);
    if (selectedItems.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one recommendation to save.');
      return;
    }

    setSaving(true);
    try {
      let targetListId = existingListId;

      // Workflow A: Create new list first if not adding to existing
      if (!targetListId) {
        const newList = await createPackingList({
          eventName: eventName.trim(),
          destination: destination.trim(),
          eventType,
          startDate: startDate || null,
          endDate: endDate || null,
          description: parsedData.tripSummary || `Generated with PackWise AI for ${destination}`,
        });
        targetListId = newList.listId;
      }

      // Format items for backend batch insertion
      const formattedItems = selectedItems.map((item) => ({
        itemName: item.name,
        category: item.category,
        quantity: item.quantity,
        priority: item.priority,
        notes: item.reason || (item.weatherRelated ? 'Weather recommendation' : ''),
        containerId: null,
      }));

      // Batch add items
      await batchAddItemsToList(targetListId, formattedItems);

      Alert.alert(
        'Success',
        `Added ${selectedItems.length} items to "${eventName}".`,
        [
          {
            text: 'View Checklist',
            onPress: () => router.replace(`/lists/${targetListId}`),
          },
        ]
      );
    } catch (err) {
      console.error('Failed to save AI recommendations:', err);
      Alert.alert('Save Error', err.message || 'Failed to save recommendations.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Review Recommendations" showBack={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Trip Summary Card */}
        <View style={styles.summaryBanner}>
          <View style={styles.summaryHeader}>
            <Ionicons name="sparkles" size={18} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.summaryTitle}>{eventName}</Text>
          </View>
          <Text style={styles.summaryText}>
            {parsedData.tripSummary ||
              `Personalized suggestions for ${destination} (${parsedData.durationDays || '5'} days)`}
          </Text>
        </View>

        {/* Weather Forecast Card */}
        {parsedData.weather && (
          <View style={styles.weatherSection}>
            <WeatherSummaryCard weather={parsedData.weather} />
          </View>
        )}

        {/* Practical Tips Callout if available */}
        {parsedData.generalTips && parsedData.generalTips.length > 0 && (
          <View style={styles.tipsBox}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb-outline" size={16} color="#B45309" style={{ marginRight: 6 }} />
              <Text style={styles.tipsTitle}>PackWise Travel Tips</Text>
            </View>
            {parsedData.generalTips.map((tip, idx) => (
              <Text key={idx} style={styles.tipItem}>
                • {tip}
              </Text>
            ))}
          </View>
        )}

        {/* Selection Toolbar */}
        <View style={styles.toolbarRow}>
          <TouchableOpacity
            onPress={handleToggleAll}
            style={styles.toggleAllBtn}
            activeOpacity={0.7}
          >
            <Ionicons
              name={allSelected ? 'checkbox' : 'checkbox-outline'}
              size={18}
              color={Colors.primary}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.toggleAllText}>
              {allSelected ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.countBadge}>
            {selectedCount} of {recommendations.length} selected
          </Text>
        </View>

        {/* Filter Pills Row */}
        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            onPress={() => setFilterMode('All')}
            style={[styles.pill, filterMode === 'All' && styles.pillActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, filterMode === 'All' && styles.pillTextActive]}>
              All ({recommendations.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterMode('Weather')}
            style={[styles.pill, filterMode === 'Weather' && styles.pillActive]}
            activeOpacity={0.7}
          >
            <Ionicons
              name="rainy-outline"
              size={13}
              color={filterMode === 'Weather' ? '#FFFFFF' : '#2563EB'}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.pillText, filterMode === 'Weather' && styles.pillTextActive]}>
              Weather Gear ({recommendations.filter((r) => r.weatherRelated).length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterMode('Essential')}
            style={[styles.pill, filterMode === 'Essential' && styles.pillActive]}
            activeOpacity={0.7}
          >
            <Ionicons
              name="star-outline"
              size={13}
              color={filterMode === 'Essential' ? '#FFFFFF' : '#D97706'}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.pillText, filterMode === 'Essential' && styles.pillTextActive]}>
              Essentials ({recommendations.filter((r) => r.essential).length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recommendations List */}
        <View style={styles.itemsList}>
          {filteredItems.length === 0 ? (
            <View style={styles.emptyItems}>
              <Text style={styles.emptyText}>No recommendations match this filter.</Text>
            </View>
          ) : (
            filteredItems.map((item) => (
              <RecommendationCard
                key={item.id}
                item={item}
                isSelected={Boolean(item.selected)}
                onToggleSelect={() => handleToggleItem(item.id)}
                onQuantityChange={(qty) => handleQuantityChange(item.id, qty)}
                onRemove={() => handleRemoveItem(item.id)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInfo}>
          <Text style={styles.bottomCountText}>{selectedCount} items ready</Text>
          <Text style={styles.bottomTargetText}>
            {existingListId ? `Target: ${eventName}` : 'Will create new packing list'}
          </Text>
        </View>

        <PrimaryButton
          title={
            saving
              ? 'Saving Items...'
              : existingListId
              ? `Add to List (${selectedCount})`
              : `Save & Create List (${selectedCount})`
          }
          onPress={handleSaveItems}
          loading={saving}
          disabled={saving || selectedCount === 0}
          style={styles.saveBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 110,
  },
  summaryBanner: {
    backgroundColor: '#F9FAFB',
    borderRadius: Radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  summaryText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  weatherSection: {
    marginBottom: 14,
  },
  tipsBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: Radii.md,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  tipItem: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 18,
    marginTop: 2,
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  toggleAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  toggleAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  countBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  itemsList: {
    marginBottom: 20,
  },
  emptyItems: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.md,
  },
  bottomBarInfo: {
    flex: 1,
    marginRight: 14,
  },
  bottomCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  bottomTargetText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  saveBtn: {
    minWidth: 160,
  },
});

