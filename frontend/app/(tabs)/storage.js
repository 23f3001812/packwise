import React, { useState, useCallback } from 'react';
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
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radii } from '../../constants/theme';
import { ContainerCard } from '../../components/storage/ContainerCard';
import { ContainerModal } from '../../components/storage/ContainerModal';
import { ContainerItemListModal } from '../../components/storage/ContainerItemListModal';
import { PrimaryButton } from '../../components/buttons/PrimaryButton';
import {
  fetchContainers,
  createContainer,
  updateContainer,
  deleteContainer,
} from '../../services/containerService';

const CONTAINER_FILTER_TYPES = [
  'All',
  'Suitcase',
  'Backpack',
  'Handbag',
  'Duffel bag',
  'Storage box',
];

export default function StorageScreen() {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  // Modals
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContainer, setEditingContainer] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Selected container for viewing assigned items
  const [viewingContainer, setViewingContainer] = useState(null);
  const [itemsModalVisible, setItemsModalVisible] = useState(false);

  const loadContainers = async () => {
    try {
      setLoading(true);
      const data = await fetchContainers();
      setContainers(data);
    } catch (err) {
      console.warn('Failed to load containers:', err.message);
      Alert.alert('Notice', 'Could not load containers. Ensure the PackWise backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadContainers();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await fetchContainers();
      setContainers(data);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateOrEditSubmit = async (formData) => {
    setSubmitting(true);
    try {
      if (editingContainer) {
        const updated = await updateContainer(editingContainer.containerId, formData);
        setContainers((prev) =>
          prev.map((c) =>
            c.containerId === editingContainer.containerId
              ? { ...c, ...updated }
              : c
          )
        );
      } else {
        const created = await createContainer(formData);
        setContainers((prev) => [...prev, created]);
      }
      setModalVisible(false);
      setEditingContainer(null);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save container.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteContainer = (container) => {
    Alert.alert(
      'Delete Container',
      `Are you sure you want to delete "${container.containerName}"?\n\nAny items assigned to this container will remain intact in your packing checklists.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteContainer(container.containerId);
              setContainers((prev) =>
                prev.filter((c) => c.containerId !== container.containerId)
              );
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete container.');
            }
          },
        },
      ]
    );
  };

  const handleCardPress = (container) => {
    setViewingContainer(container);
    setItemsModalVisible(true);
  };

  // Filter & Search
  const filteredContainers = containers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.containerName?.toLowerCase().includes(q) ||
      c.containerType?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (selectedType !== 'All' && c.containerType !== selectedType) {
      return false;
    }

    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Storage Manager</Text>
          <Text style={styles.headerSubtitle}>
            {containers.length} {containers.length === 1 ? 'Container' : 'Containers'} • Bags & Luggage
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={19} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search containers..."
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Pills */}
        <View style={styles.filterWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {CONTAINER_FILTER_TYPES.map((type) => {
              const isSelected = selectedType === type;
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => setSelectedType(type)}
                  style={[styles.filterChip, isSelected && styles.filterChipActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Body List */}
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading storage containers...</Text>
          </View>
        ) : filteredContainers.length === 0 ? (
          <ScrollView
            contentContainerStyle={styles.emptyContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
            }
          >
            <View style={styles.emptyIconCircle}>
              <Ionicons name="cube-outline" size={50} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No matching containers' : 'No containers yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Try a different search term or filter.'
                : 'Add suitcases, backpacks, and packing cubes to easily track where your items are stored.'}
            </Text>
            {!searchQuery && (
              <PrimaryButton
                title="Add First Container"
                onPress={() => {
                  setEditingContainer(null);
                  setModalVisible(true);
                }}
                style={styles.addFirstBtn}
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
            {filteredContainers.map((container) => (
              <ContainerCard
                key={container.containerId}
                container={container}
                onPress={() => handleCardPress(container)}
                onEdit={() => {
                  setEditingContainer(container);
                  setModalVisible(true);
                }}
                onDelete={() => handleDeleteContainer(container)}
              />
            ))}
          </ScrollView>
        )}

        {/* Bottom Add Action */}
        {filteredContainers.length > 0 && (
          <View style={styles.bottomSection}>
            <PrimaryButton
              title="Add Container +"
              onPress={() => {
                setEditingContainer(null);
                setModalVisible(true);
              }}
            />
          </View>
        )}
      </View>

      {/* Add / Edit Container Modal */}
      <ContainerModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingContainer(null);
        }}
        onSubmit={handleCreateOrEditSubmit}
        initialContainer={editingContainer}
        loading={submitting}
      />

      {/* Container Items Details Modal */}
      <ContainerItemListModal
        visible={itemsModalVisible}
        container={viewingContainer}
        onClose={() => {
          setItemsModalVisible(false);
          setViewingContainer(null);
        }}
      />
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
    paddingTop: 12,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  filterWrap: {
    marginBottom: 14,
  },
  filterScroll: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.textInverse,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 50,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
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
    marginBottom: 22,
  },
  addFirstBtn: {
    minWidth: 200,
  },
  listContent: {
    paddingBottom: 24,
  },
  bottomSection: {
    paddingVertical: 12,
  },
});
