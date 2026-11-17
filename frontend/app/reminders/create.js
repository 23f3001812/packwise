import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radii, Shadows } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { PrimaryButton } from '../../components/buttons/PrimaryButton';
import { fetchLocations } from '../../services/locationService';
import { fetchPackingLists, fetchPackingListById } from '../../services/packingService';
import { fetchSharedLists } from '../../services/collaborationService';
import { createReminder, updateReminder } from '../../services/reminderService';

export default function CreateReminderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isEditMode = params.editMode === 'true';

  const [locations, setLocations] = useState([]);
  const [availableLists, setAvailableLists] = useState([]);
  const [listItems, setListItems] = useState([]);

  const [selectedLocationId, setSelectedLocationId] = useState(
    params.locationId || params.prefillLocationId || ''
  );
  const [selectedListIds, setSelectedListIds] = useState(() => {
    try {
      return params.packingListIds ? JSON.parse(params.packingListIds) : [];
    } catch {
      return [];
    }
  });
  const [selectedItemIds, setSelectedItemIds] = useState(() => {
    try {
      return params.itemIds ? JSON.parse(params.itemIds) : [];
    } catch {
      return [];
    }
  });

  const [customMessage, setCustomMessage] = useState(params.customMessage || '');
  const [onlyUnpacked, setOnlyUnpacked] = useState(params.onlyUnpacked !== 'false');
  const [isEnabled, setIsEnabled] = useState(params.isEnabled !== 'false');

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load locations and available lists
  useEffect(() => {
    const loadPrerequisites = async () => {
      try {
        setLoadingInitial(true);
        const [locs, myLists, shared] = await Promise.all([
          fetchLocations().catch(() => []),
          fetchPackingLists().catch(() => []),
          fetchSharedLists().catch(() => []),
        ]);

        setLocations(locs);
        // Combine lists and deduplicate
        const combined = [...myLists];
        shared.forEach((sh) => {
          if (!combined.some((l) => l.listId === sh.listId)) {
            combined.push(sh);
          }
        });
        setAvailableLists(combined);

        if (locs.length > 0 && !selectedLocationId) {
          setSelectedLocationId(locs[0].locationId);
        }
      } catch (err) {
        console.warn('Error loading options:', err.message);
      } finally {
        setLoadingInitial(false);
      }
    };

    loadPrerequisites();
  }, []);

  // When selected lists change, load items for selection
  useEffect(() => {
    const loadItemsForLists = async () => {
      if (selectedListIds.length === 0) {
        setListItems([]);
        return;
      }

      setLoadingItems(true);
      try {
        const itemArrays = await Promise.all(
          selectedListIds.map(async (lId) => {
            try {
              const res = await fetchPackingListById(lId);
              return res.items || [];
            } catch {
              return [];
            }
          })
        );
        const flattened = itemArrays.flat();
        setListItems(flattened);
      } catch (err) {
        console.warn('Error loading list items:', err.message);
      } finally {
        setLoadingItems(false);
      }
    };

    loadItemsForLists();
  }, [selectedListIds]);

  const toggleListSelection = (listId) => {
    setSelectedListIds((prev) => {
      if (prev.includes(listId)) {
        return prev.filter((id) => id !== listId);
      } else {
        return [...prev, listId];
      }
    });
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItemIds((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const handleSubmit = async () => {
    if (!selectedLocationId) {
      Alert.alert('Location Required', 'Please select a saved place for this reminder.');
      return;
    }

    if (selectedListIds.length === 0) {
      Alert.alert('Checklist Required', 'Please select at least one packing list to monitor.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        locationId: selectedLocationId,
        packingListIds: selectedListIds,
        itemIds: selectedItemIds,
        customMessage: customMessage.trim(),
        onlyUnpacked,
        isEnabled,
      };

      if (isEditMode) {
        await updateReminder(params.reminderId, payload);
        Alert.alert('Success', 'Reminder updated successfully.');
      } else {
        await createReminder(payload);
        Alert.alert('Success', 'Leave-behind reminder activated.');
      }
      router.back();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save reminder.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title={isEditMode ? 'Edit Reminder' : 'Create Reminder'} showBack={true} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading options...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title={isEditMode ? 'Edit Reminder' : 'Create Reminder'} showBack={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1: Select Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Select Saved Location *</Text>
          <Text style={styles.sectionSubtitle}>
            When you leave this place, PackWise will evaluate this reminder.
          </Text>

          {locations.length === 0 ? (
            <View style={styles.warningCard}>
              <Ionicons name="warning-outline" size={18} color={Colors.warning} />
              <View style={styles.warningTextCol}>
                <Text style={styles.warningTitle}>No saved locations found</Text>
                <Text style={styles.warningSub}>
                  You need to save at least one location (e.g. Home, Office) first.
                </Text>
                <TouchableOpacity
                  style={styles.addLocationInlineBtn}
                  onPress={() => router.push('/locations/create')}
                >
                  <Text style={styles.addLocationInlineText}>+ Add Location</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.chipsWrap}>
              {locations.map((loc) => {
                const isSelected = selectedLocationId === loc.locationId;
                return (
                  <TouchableOpacity
                    key={loc.locationId}
                    style={[styles.locationChip, isSelected && styles.locationChipActive]}
                    onPress={() => setSelectedLocationId(loc.locationId)}
                  >
                    <Ionicons
                      name="location"
                      size={14}
                      color={isSelected ? '#FFFFFF' : Colors.primary}
                    />
                    <Text
                      style={[styles.locationChipText, isSelected && styles.locationChipTextActive]}
                    >
                      {loc.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Step 2: Select Packing List(s) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Select Packing Checklist(s) *</Text>
          <Text style={styles.sectionSubtitle}>
            Choose which trips or checklists contain the belongings to check.
          </Text>

          {availableLists.length === 0 ? (
            <Text style={styles.noDataNotice}>No packing lists created yet.</Text>
          ) : (
            <View style={styles.chipsWrap}>
              {availableLists.map((list) => {
                const isSelected = selectedListIds.includes(list.listId);
                return (
                  <TouchableOpacity
                    key={list.listId}
                    style={[styles.listChip, isSelected && styles.listChipActive]}
                    onPress={() => toggleListSelection(list.listId)}
                  >
                    <Ionicons
                      name={isSelected ? 'checkbox' : 'square-outline'}
                      size={16}
                      color={isSelected ? '#FFFFFF' : Colors.textSecondary}
                    />
                    <Text style={[styles.listChipText, isSelected && styles.listChipTextActive]}>
                      {list.eventName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Step 3: Specific Items or All Items */}
        {selectedListIds.length > 0 && (
          <View style={styles.section}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>3. Select Specific Belongings</Text>
              {listItems.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    if (selectedItemIds.length === listItems.length) {
                      setSelectedItemIds([]);
                    } else {
                      setSelectedItemIds(listItems.map((i) => i.itemId));
                    }
                  }}
                >
                  <Text style={styles.selectAllText}>
                    {selectedItemIds.length === listItems.length ? 'Clear All' : 'Select All'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.sectionSubtitle}>
              Leave empty to automatically monitor all items in the selected checklist(s).
            </Text>

            {loadingItems ? (
              <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 10 }} />
            ) : listItems.length === 0 ? (
              <Text style={styles.noDataNotice}>No items found in selected checklist(s).</Text>
            ) : (
              <View style={styles.itemsListContainer}>
                {listItems.map((item) => {
                  const isSelected = selectedItemIds.includes(item.itemId);
                  return (
                    <TouchableOpacity
                      key={item.itemId}
                      style={[styles.itemRow, isSelected && styles.itemRowActive]}
                      onPress={() => toggleItemSelection(item.itemId)}
                    >
                      <Ionicons
                        name={isSelected ? 'checkbox' : 'square-outline'}
                        size={18}
                        color={isSelected ? Colors.primary : Colors.textMuted}
                      />
                      <Text style={styles.itemRowName}>{item.itemName}</Text>
                      {item.category && (
                        <View style={styles.itemCatBadge}>
                          <Text style={styles.itemCatText}>{item.category}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Custom Message */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custom Notification Message (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Remember your Laptop, Keys and Charger!"
            placeholderTextColor={Colors.textMuted}
            value={customMessage}
            onChangeText={setCustomMessage}
          />
        </View>

        {/* Only Unpacked Items Toggle */}
        <View style={[styles.switchCard, Shadows.card]}>
          <View style={styles.switchTextCol}>
            <Text style={styles.switchTitle}>Only Unpacked Belongings</Text>
            <Text style={styles.switchSub}>
              Recommended: Only alert you about items not yet packed. If everything is already packed, no alert will be sent.
            </Text>
          </View>
          <Switch
            value={onlyUnpacked}
            onValueChange={setOnlyUnpacked}
            trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
            thumbColor={onlyUnpacked ? Colors.primary : '#F3F4F6'}
          />
        </View>

        {/* Enabled Toggle */}
        <View style={[styles.switchCard, Shadows.card]}>
          <View style={styles.switchTextCol}>
            <Text style={styles.switchTitle}>Enable Reminder</Text>
            <Text style={styles.switchSub}>
              Active leave-behind triggers will execute when you depart this location.
            </Text>
          </View>
          <Switch
            value={isEnabled}
            onValueChange={setIsEnabled}
            trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
            thumbColor={isEnabled ? Colors.primary : '#F3F4F6'}
          />
        </View>

        {/* Submit Button */}
        <PrimaryButton
          title={isEditMode ? 'Update Reminder' : 'Save Leave-Behind Reminder'}
          onPress={handleSubmit}
          loading={submitting}
          style={styles.submitBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 10,
    lineHeight: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.full,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  locationChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  locationChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  locationChipTextActive: {
    color: '#FFFFFF',
  },
  listChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.full,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  listChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  listChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  listChipTextActive: {
    color: '#FFFFFF',
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: Radii.md,
    padding: 12,
  },
  warningTextCol: {
    marginLeft: 10,
    flex: 1,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  warningSub: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
  addLocationInlineBtn: {
    marginTop: 6,
  },
  addLocationInlineText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  noDataNotice: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  itemsListContainer: {
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 6,
    maxHeight: 220,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: Radii.sm,
  },
  itemRowActive: {
    backgroundColor: Colors.primarySurface,
  },
  itemRowName: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  itemCatBadge: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.sm,
  },
  itemCatText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  input: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  switchTextCol: {
    flex: 1,
    marginRight: 10,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  switchSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  submitBtn: {
    marginTop: 10,
  },
});

