import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radii } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { PackingListCard } from '../../components/packing/PackingListCard';
import { PrimaryButton } from '../../components/buttons/PrimaryButton';
import { fetchPackingLists, deletePackingList } from '../../services/packingService';
import { fetchSharedLists } from '../../services/collaborationService';

export default function PackingListsScreen() {
  const router = useRouter();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All'); // 'All' | 'In Progress' | 'Completed'
  const [ownershipFilter, setOwnershipFilter] = useState('All'); // 'All' | 'My Lists' | 'Shared With Me'

  const loadLists = async () => {
    try {
      setLoading(true);
      const [myLists, sharedLists] = await Promise.all([
        fetchPackingLists().catch(() => []),
        fetchSharedLists().catch(() => []),
      ]);

      const combined = [
        ...myLists.map((l) => ({ ...l, isSharedWithMe: false })),
        ...sharedLists.map((l) => ({ ...l, isSharedWithMe: true })),
      ];
      setLists(combined);
    } catch (err) {
      console.warn('Failed to load packing lists:', err.message);
      Alert.alert('Network Notice', 'Could not load packing lists. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadLists();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const [myLists, sharedLists] = await Promise.all([
        fetchPackingLists().catch(() => []),
        fetchSharedLists().catch(() => []),
      ]);
      const combined = [
        ...myLists.map((l) => ({ ...l, isSharedWithMe: false })),
        ...sharedLists.map((l) => ({ ...l, isSharedWithMe: true })),
      ];
      setLists(combined);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteList = (list) => {
    Alert.alert(
      'Delete Packing List',
      `Are you sure you want to delete "${list.eventName}"? All items inside this list will also be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePackingList(list.listId);
              setLists((prev) => prev.filter((l) => l.listId !== list.listId));
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete packing list.');
            }
          },
        },
      ]
    );
  };

  const handleEditList = (list) => {
    router.push({
      pathname: '/lists/create',
      params: {
        editMode: 'true',
        listId: list.listId,
        eventName: list.eventName,
        destination: list.destination,
        eventType: list.eventType,
        startDate: list.startDate || '',
        endDate: list.endDate || '',
        description: list.description || '',
      },
    });
  };

  // Filter & Search
  const filteredLists = lists.filter((list) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      list.eventName?.toLowerCase().includes(q) ||
      list.destination?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (ownershipFilter === 'My Lists' && list.isSharedWithMe) return false;
    if (ownershipFilter === 'Shared With Me' && !list.isSharedWithMe) return false;

    const stats = list.stats || { packingProgress: 0, totalItems: 0 };
    const isCompleted = stats.packingProgress === 100 && stats.totalItems > 0;

    if (filterStatus === 'Completed') return isCompleted;
    if (filterStatus === 'In Progress') return !isCompleted;
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Packing Lists"
        showBack={true}
        onBackPress={() => router.replace('/(tabs)')}
        rightIconName="add-circle-outline"
        onRightPress={() => router.push('/lists/create')}
      />

      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={19} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search trips, destinations..."
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Ownership Filter Pills */}
        <View style={styles.filterRow}>
          {['All', 'My Lists', 'Shared With Me'].map((ownership) => {
            const isSelected = ownershipFilter === ownership;
            return (
              <TouchableOpacity
                key={ownership}
                onPress={() => setOwnershipFilter(ownership)}
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}>
                  {ownership}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Body content */}
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading your packing lists...</Text>
          </View>
        ) : filteredLists.length === 0 ? (
          <ScrollView
            contentContainerStyle={styles.emptyContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
            }
          >
            <View style={styles.emptyIllustration}>
              <Ionicons name="briefcase-outline" size={54} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No matching lists found' : 'No packing lists yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Try adjusting your search terms or filters.'
                : 'Plan your next trip and organize all your belongings smartly.'}
            </Text>
            {!searchQuery && (
              <PrimaryButton
                title="Create First Packing List"
                onPress={() => router.push('/lists/create')}
                style={styles.createFirstBtn}
              />
            )}
          </ScrollView>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
            }
          >
            {filteredLists.map((list) => (
              <PackingListCard
                key={list.listId}
                list={list}
                onPress={() => router.push(`/lists/${list.listId}`)}
                onEdit={() => handleEditList(list)}
                onDelete={() => handleDeleteList(list)}
              />
            ))}
          </ScrollView>
        )}

        {/* Floating Create Button */}
        {filteredLists.length > 0 && (
          <View style={styles.floatingButtonContainer}>
            <PrimaryButton
              title="Create New List +"
              onPress={() => router.push('/lists/create')}
              style={styles.floatingButton}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radii.full,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterPillTextActive: {
    color: Colors.textInverse,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  emptyIllustration: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  createFirstBtn: {
    minWidth: 220,
  },
  listContent: {
    paddingBottom: 90,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  floatingButton: {
    elevation: 4,
  },
});

