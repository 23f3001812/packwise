import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radii, Shadows } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { PackingModeToggle } from '../../components/packing/PackingModeToggle';
import { CategorySection } from '../../components/packing/CategorySection';
import { PackingItemCard } from '../../components/packing/PackingItemCard';
import { AddItemModal } from '../../components/packing/AddItemModal';
import { PrimaryButton } from '../../components/buttons/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { useCollaborativeList } from '../../hooks/useCollaborativeList';
import { CollaboratorAvatarGroup } from '../../components/collaboration/CollaboratorAvatarGroup';
import { leaveList } from '../../services/collaborationService';
import {
  scheduleTripReminder,
  cancelScheduledNotification,
} from '../../services/notificationService';
import {
  fetchPackingListById,
  updatePackingList,
  deletePackingList,
} from '../../services/packingService';
import {
  addItem,
  updateItem,
  updateItemStatus,
  deleteItem,
} from '../../services/itemService';
import { fetchContainers } from '../../services/containerService';

export default function PackingListDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();

  // Real-Time Collaborative Listener Hook
  const {
    listData: liveListData,
    items: liveItems,
    members: liveMembers,
    myRole: liveRole,
    isOwner: liveIsOwner,
    isCollaborative: liveIsCollaborative,
    loading: liveLoading,
  } = useCollaborativeList(id, user?.uid);

  const [listData, setListData] = useState(null);
  const [items, setItems] = useState([]);
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Sync real-time Firestore list metadata
  useEffect(() => {
    if (liveListData) {
      setListData(liveListData);
    }
  }, [liveListData]);

  // Sync real-time Firestore items
  useEffect(() => {
    if (liveItems && liveItems.length > 0) {
      setItems(liveItems);
    } else if (liveItems && liveItems.length === 0 && !loading && !liveLoading) {
      setItems([]);
    }
  }, [liveItems, loading, liveLoading]);

  // Derived Access & Role
  const isOwner = Boolean(
    (listData && (listData.userId === user?.uid || listData.ownerId === user?.uid)) ||
    liveIsOwner
  );
  const isCollaborative = Boolean(
    listData?.isCollaborative ||
    (liveMembers && liveMembers.length > 0) ||
    liveIsCollaborative
  );
  const myRole = isOwner ? 'owner' : (liveRole || 'editor');
  const isViewer = myRole === 'viewer';
  const canEdit = !isViewer;

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All'); // 'All' | 'Packed' | 'Unpacked' | 'Remaining'
  const [selectedPriority, setSelectedPriority] = useState('All'); // 'All' | 'High' | 'Medium' | 'Low'
  const [viewMode, setViewMode] = useState('category'); // 'category' | 'flat'

  // Modal States
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submittingItem, setSubmittingItem] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [listResult, containersResult] = await Promise.all([
        fetchPackingListById(id).catch(() => null),
        fetchContainers().catch(() => []),
      ]);
      if (listResult?.list) {
        setListData((prev) => prev || listResult.list);
      }
      if (listResult?.items && items.length === 0) {
        setItems(listResult.items);
      }
      setContainers(containersResult || []);
    } catch (err) {
      console.warn('Failed to load list details:', err.message);
      Alert.alert('Error', err.message || 'Could not load packing list details.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (id) {
        loadData();
      }
    }, [id])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const [listResult, containersResult] = await Promise.all([
        fetchPackingListById(id).catch(() => null),
        fetchContainers().catch(() => []),
      ]);
      if (listResult?.list) setListData(listResult.list);
      if (listResult?.items) setItems(listResult.items);
      if (containersResult) setContainers(containersResult);
    } finally {
      setRefreshing(false);
    }
  };

  // Toggle Mode (Packing vs Unpacking)
  const handleModeChange = async (newMode) => {
    if (!listData || listData.mode === newMode) return;

    // Optimistic UI update
    setListData((prev) => ({ ...prev, mode: newMode }));
    if (canEdit) {
      try {
        await updatePackingList(id, { mode: newMode });
      } catch (err) {
        console.warn('Failed to persist mode change:', err.message);
      }
    }
  };

  // Toggle Item Packed/Unpacked Status
  const handleToggleItemStatus = async (item) => {
    if (isViewer) {
      Alert.alert('Read-Only Access', 'You have viewer permissions for this list. Only editors and the owner can check items.');
      return;
    }

    const isUnpacking = listData?.mode === 'unpacking';

    if (isUnpacking && !item.isPacked) {
      Alert.alert('Notice', 'This item was not marked packed, so it cannot be unpacked.');
      return;
    }

    // Determine target updates
    let targetPacked = item.isPacked;
    let targetUnpacked = item.isUnpacked;

    if (!isUnpacking) {
      targetPacked = !item.isPacked;
      if (!targetPacked) targetUnpacked = false;
    } else {
      targetUnpacked = !item.isUnpacked;
    }

    // Optimistic update
    setItems((prev) =>
      prev.map((i) =>
        i.itemId === item.itemId
          ? { ...i, isPacked: targetPacked, isUnpacked: targetUnpacked }
          : i
      )
    );

    try {
      await updateItemStatus(item.itemId, {
        isPacked: targetPacked,
        isUnpacked: targetUnpacked,
      });
    } catch (err) {
      // Rollback on failure
      setItems((prev) =>
        prev.map((i) => (i.itemId === item.itemId ? item : i))
      );
      Alert.alert('Error', err.message || 'Failed to update item status.');
    }
  };

  // Add or Edit Item Submit
  const handleItemSubmit = async (formData) => {
    if (isViewer) {
      Alert.alert('Read-Only Access', 'You cannot add or edit items with view-only permissions.');
      return;
    }

    setSubmittingItem(true);
    try {
      if (editingItem) {
        const updated = await updateItem(editingItem.itemId, formData);
        const assignedCont = containers.find((c) => c.containerId === formData.containerId);
        setItems((prev) =>
          prev.map((i) =>
            i.itemId === editingItem.itemId
              ? { ...updated, containerName: assignedCont ? assignedCont.containerName : null }
              : i
          )
        );
      } else {
        const created = await addItem(id, formData);
        const assignedCont = containers.find((c) => c.containerId === formData.containerId);
        setItems((prev) => [
          { ...created, containerName: assignedCont ? assignedCont.containerName : null },
          ...prev,
        ]);
      }
      setItemModalVisible(false);
      setEditingItem(null);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save item.');
    } finally {
      setSubmittingItem(false);
    }
  };

  // Delete Item
  const handleDeleteItem = (item) => {
    if (isViewer) {
      Alert.alert('Read-Only Access', 'You cannot delete items with view-only permissions.');
      return;
    }

    Alert.alert('Delete Item', `Are you sure you want to remove "${item.itemName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteItem(item.itemId);
            setItems((prev) => prev.filter((i) => i.itemId !== item.itemId));
          } catch (err) {
            Alert.alert('Error', err.message || 'Failed to delete item.');
          }
        },
      },
    ]);
  };

  // Delete whole list (Owner only)
  const handleDeleteList = () => {
    Alert.alert(
      'Delete Packing List',
      `Are you sure you want to delete "${listData?.eventName}"? All items will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (listData?.scheduledReminderId) {
                cancelScheduledNotification(listData.scheduledReminderId).catch(() => {});
              }
              await deletePackingList(id);
              router.replace('/lists');
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete list.');
            }
          },
        },
      ]
    );
  };

  // Schedule or Edit Trip Departure Reminder
  const handleScheduleReminder = () => {
    if (!listData?.startDate) {
      Alert.alert('Missing Date', 'Please add a start date to this trip before scheduling reminders.');
      return;
    }

    Alert.alert(
      'Trip Packing Reminder',
      `Schedule an advance notification for ${listData.eventName}:`,
      [
        {
          text: '1 Day Before (9:00 AM)',
          onPress: async () => {
            try {
              const res = await scheduleTripReminder(listData, '1_day_before');
              await updatePackingList(id, {
                reminderScheduled: true,
                scheduledReminderId: res.notificationId,
                reminderOption: '1_day_before',
              });
              setListData((prev) => ({
                ...prev,
                reminderScheduled: true,
                scheduledReminderId: res.notificationId,
                reminderOption: '1_day_before',
              }));
              Alert.alert('Scheduled!', 'You will receive a packing reminder 1 day before departure.');
            } catch (err) {
              Alert.alert('Notice', err.message || 'Could not schedule reminder.');
            }
          },
        },
        {
          text: '3 Days Before (9:00 AM)',
          onPress: async () => {
            try {
              const res = await scheduleTripReminder(listData, '3_days_before');
              await updatePackingList(id, {
                reminderScheduled: true,
                scheduledReminderId: res.notificationId,
                reminderOption: '3_days_before',
              });
              setListData((prev) => ({
                ...prev,
                reminderScheduled: true,
                scheduledReminderId: res.notificationId,
                reminderOption: '3_days_before',
              }));
              Alert.alert('Scheduled!', 'You will receive a packing reminder 3 days before departure.');
            } catch (err) {
              Alert.alert('Notice', err.message || 'Could not schedule reminder.');
            }
          },
        },
        listData?.reminderScheduled
          ? {
              text: 'Cancel Reminder',
              style: 'destructive',
              onPress: async () => {
                if (listData.scheduledReminderId) {
                  await cancelScheduledNotification(listData.scheduledReminderId);
                }
                await updatePackingList(id, {
                  reminderScheduled: false,
                  scheduledReminderId: null,
                });
                setListData((prev) => ({
                  ...prev,
                  reminderScheduled: false,
                  scheduledReminderId: null,
                }));
                Alert.alert('Removed', 'Scheduled trip reminder removed.');
              },
            }
          : { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Leave shared list (Collaborator only)
  const handleLeaveTrip = () => {
    Alert.alert(
      'Leave Shared Trip',
      `Are you sure you want to leave "${listData?.eventName || 'this list'}"? You will lose access to this list until re-invited.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveList(id);
              Alert.alert('Left Trip', 'You have left the shared packing list.');
              router.replace('/lists');
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to leave list.');
            }
          },
        },
      ]
    );
  };

  // Edit list navigation
  const handleEditList = () => {
    router.push({
      pathname: '/lists/create',
      params: {
        editMode: 'true',
        listId: listData.listId,
        eventName: listData.eventName,
        destination: listData.destination,
        eventType: listData.eventType,
        startDate: listData.startDate || '',
        endDate: listData.endDate || '',
        description: listData.description || '',
      },
    });
  };

  // Enrich items with container names
  const itemsWithContainers = useMemo(() => {
    const containerMap = {};
    (containers || []).forEach((c) => {
      containerMap[c.containerId] = c.containerName;
    });
    return items.map((item) => ({
      ...item,
      containerName: item.containerName || (item.containerId ? containerMap[item.containerId] : null),
    }));
  }, [items, containers]);

  // Dynamic Progress Calculation
  const isUnpackingMode = listData?.mode === 'unpacking';
  const totalItemsCount = itemsWithContainers.length;
  const packedCount = itemsWithContainers.filter((i) => i.isPacked).length;
  const unpackedCount = itemsWithContainers.filter((i) => i.isUnpacked).length;

  const packingPercent = totalItemsCount > 0 ? Math.round((packedCount / totalItemsCount) * 100) : 0;
  const unpackingPercent = packedCount > 0 ? Math.round((unpackedCount / packedCount) * 100) : 0;

  const currentPercent = isUnpackingMode ? unpackingPercent : packingPercent;
  const isComplete = totalItemsCount > 0 && currentPercent === 100;

  // Filter items
  const filteredItems = useMemo(() => {
    return itemsWithContainers.filter((item) => {
      // Search filter
      const q = searchQuery.toLowerCase().trim();
      if (q && !item.itemName?.toLowerCase().includes(q)) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }

      // Priority filter
      if (selectedPriority !== 'All' && item.priority !== selectedPriority) {
        return false;
      }

      // Status filter
      if (selectedStatus === 'Packed' && !item.isPacked) return false;
      if (selectedStatus === 'Remaining' && item.isPacked) return false;
      if (selectedStatus === 'Unpacked' && !item.isUnpacked) return false;

      return true;
    });
  }, [items, searchQuery, selectedCategory, selectedPriority, selectedStatus]);

  // Group items by category
  const groupedByCategory = useMemo(() => {
    const groups = {};
    filteredItems.forEach((item) => {
      const cat = item.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [filteredItems]);

  const categoryList = Object.keys(groupedByCategory);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'All' ||
    selectedStatus !== 'All' ||
    selectedPriority !== 'All';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedStatus('All');
    setSelectedPriority('All');
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Checklist" showBack={true} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading checklist...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Screen Header */}
      <Header
        title={listData?.eventName || 'Checklist'}
        showBack={true}
        rightAction={
          <View style={styles.headerActions}>
            {/* Gemini AI Suggestions Action */}
            {canEdit && (
              <TouchableOpacity
                onPress={() => {
                  const existingNames = itemsWithContainers.map((i) => i.itemName).filter(Boolean);
                  router.push({
                    pathname: '/ai',
                    params: {
                      listId: listData?.listId || id,
                      eventName: listData?.eventName || '',
                      destination: listData?.destination || '',
                      eventType: listData?.eventType || '',
                      startDate: listData?.startDate || '',
                      endDate: listData?.endDate || '',
                      existingItems: JSON.stringify(existingNames),
                    },
                  });
                }}
                style={styles.headerBtn}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                accessibilityLabel="AI Suggestions"
              >
                <Ionicons name="sparkles-outline" size={20} color={Colors.primary} />
              </TouchableOpacity>
            )}

            {/* Notification / Trip Reminder Action */}
            <TouchableOpacity
              onPress={handleScheduleReminder}
              style={styles.headerBtn}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              accessibilityLabel="Trip Reminder"
            >
              <Ionicons
                name={listData?.reminderScheduled ? 'notifications' : 'notifications-outline'}
                size={20}
                color={listData?.reminderScheduled ? Colors.primary : Colors.textPrimary}
              />
            </TouchableOpacity>

            {/* Collaborators Button */}
            <TouchableOpacity
              onPress={() => router.push(`/collaboration/members/${id}`)}
              style={styles.headerBtn}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              accessibilityLabel="Manage Collaborators"
            >
              <View style={styles.headerIconWrapper}>
                <Ionicons
                  name={isCollaborative ? 'people' : 'people-outline'}
                  size={20}
                  color={isCollaborative ? Colors.primary : Colors.textPrimary}
                />
                {liveMembers && liveMembers.length > 0 && (
                  <View style={styles.headerBadge}>
                    <Text style={styles.headerBadgeText}>{liveMembers.length}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* More Trip Options */}
            <TouchableOpacity
              onPress={() => {
                const options = [];
                if (isOwner) {
                  options.push({ text: 'Edit Trip Details', onPress: handleEditList });
                  options.push({ text: 'Delete Trip', style: 'destructive', onPress: handleDeleteList });
                } else {
                  options.push({ text: 'Leave Shared Trip', style: 'destructive', onPress: handleLeaveTrip });
                }
                options.push({ text: 'Cancel', style: 'cancel' });
                Alert.alert(listData?.eventName || 'Trip Options', undefined, options);
              }}
              style={styles.headerBtn}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              accessibilityLabel="Trip Options"
            >
              <Ionicons name="ellipsis-vertical" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        }
      />

      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
          keyboardShouldPersistTaps="handled"
        >
          {/* Trip Destination & Info Subheader */}
          <View style={styles.tripMetaRow}>
            <View style={styles.destinationPill}>
              <Ionicons name="location-outline" size={13} color={Colors.primary} />
              <Text style={styles.destinationPillText}>{listData?.destination}</Text>
            </View>

            {listData?.startDate && (
              <View style={styles.metaPill}>
                <Ionicons name="calendar-outline" size={13} color={Colors.textSecondary} />
                <Text style={styles.metaPillText}>{listData?.startDate}</Text>
              </View>
            )}

            {listData?.eventType && (
              <View style={styles.metaPill}>
                <Text style={styles.metaPillText}>{listData?.eventType}</Text>
              </View>
            )}

            {listData?.startDate && (
              <TouchableOpacity
                style={[styles.metaPill, listData?.reminderScheduled && styles.reminderPillActive]}
                onPress={handleScheduleReminder}
              >
                <Ionicons
                  name={listData?.reminderScheduled ? 'alarm' : 'alarm-outline'}
                  size={13}
                  color={listData?.reminderScheduled ? Colors.primary : Colors.textSecondary}
                />
                <Text
                  style={[
                    styles.metaPillText,
                    listData?.reminderScheduled && styles.reminderPillTextActive,
                  ]}
                >
                  {listData?.reminderScheduled ? 'Reminder Active' : 'Set Reminder'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Read-Only Viewer Notice */}
          {isViewer && (
            <View style={styles.viewerBanner}>
              <Ionicons name="eye-outline" size={16} color="#B45309" />
              <Text style={styles.viewerBannerText}>
                Viewing Mode • You have read-only access to this shared checklist.
              </Text>
            </View>
          )}

          {/* Collaborative Trip Info Banner */}
          {isCollaborative && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push(`/collaboration/members/${id}`)}
              style={styles.collabBanner}
            >
              <View style={styles.collabBannerLeft}>
                <CollaboratorAvatarGroup members={liveMembers} maxVisible={3} size={28} />
                <View style={styles.collabBannerTextCol}>
                  <Text style={styles.collabBannerTitle}>
                    {isOwner ? 'Shared Trip • Owner' : `Shared Trip • ${myRole === 'editor' ? 'Editor' : 'Viewer'}`}
                  </Text>
                  <Text style={styles.collabBannerSub}>
                    {liveMembers.length} {liveMembers.length === 1 ? 'member' : 'members'} collaborating
                  </Text>
                </View>
              </View>
              <View style={styles.collabBannerRight}>
                <Text style={styles.collabManageText}>{isOwner ? 'Manage' : 'Members'}</Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
              </View>
            </TouchableOpacity>
          )}

          {/* Mode Switcher */}
          <PackingModeToggle
            mode={listData?.mode || 'packing'}
            onModeChange={handleModeChange}
            style={styles.modeToggle}
          />

          {/* Progress Card */}
          <View style={[styles.progressCard, Shadows.card]}>
            <View style={styles.progressCardTop}>
              <View>
                <Text style={styles.progressCardTitle}>
                  {isUnpackingMode ? 'Unpacking Progress' : 'Packing Progress'}
                </Text>
                <Text style={styles.progressCardCounts}>
                  {isUnpackingMode
                    ? `${unpackedCount} of ${packedCount} packed items accounted for`
                    : `${packedCount} of ${totalItemsCount} items packed`}
                </Text>
              </View>

              <Text style={[styles.progressCardPercent, isComplete && styles.progressCardPercentComplete]}>
                {currentPercent}%
              </Text>
            </View>

            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${currentPercent}%` },
                  isComplete && styles.progressBarFillComplete,
                ]}
              />
            </View>

            {isComplete && (
              <View style={styles.celebrationBanner}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.celebrationText}>
                  {isUnpackingMode
                    ? 'Everything unpacked. Trip successfully completed.'
                    : 'All items packed. You are ready to depart.'}
                </Text>
              </View>
            )}
          </View>

          {/* AI Suggestions Card (Owners & Editors) */}
          {canEdit && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                const existingNames = itemsWithContainers.map((i) => i.itemName).filter(Boolean);
                router.push({
                  pathname: '/ai',
                  params: {
                    listId: listData?.listId || id,
                    eventName: listData?.eventName || '',
                    destination: listData?.destination || '',
                    eventType: listData?.eventType || '',
                    startDate: listData?.startDate || '',
                    endDate: listData?.endDate || '',
                    existingItems: JSON.stringify(existingNames),
                  },
                });
              }}
              style={styles.aiSuggestCard}
            >
              <View style={styles.aiSuggestIcon}>
                <Ionicons name="sparkles" size={16} color="#FFFFFF" />
              </View>
              <View style={styles.aiSuggestContent}>
                <Text style={styles.aiSuggestTitle}>Get AI Suggestions</Text>
                <Text style={styles.aiSuggestSub}>Weather-aware recommendations for {listData?.destination}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
            </TouchableOpacity>
          )}

          {/* Search & Filter Toolbar */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Filter items..."
              placeholderTextColor={Colors.textMuted}
              style={styles.searchInput}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Filter Pills ScrollView */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
            {/* View Mode Toggle: Category vs All */}
            <TouchableOpacity
              onPress={() => setViewMode(viewMode === 'category' ? 'flat' : 'category')}
              style={[styles.filterChip, viewMode === 'flat' && styles.filterChipActive]}
            >
              <Ionicons
                name={viewMode === 'category' ? 'list' : 'apps'}
                size={14}
                color={viewMode === 'flat' ? Colors.textInverse : Colors.textSecondary}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.filterChipText, viewMode === 'flat' && styles.filterChipTextActive]}>
                {viewMode === 'category' ? 'Grouped' : 'All Items'}
              </Text>
            </TouchableOpacity>

            {/* Status Filters */}
            {['All', isUnpackingMode ? 'Unpacked' : 'Packed', 'Remaining'].map((st) => {
              const isSelected = selectedStatus === st;
              return (
                <TouchableOpacity
                  key={st}
                  onPress={() => setSelectedStatus(st)}
                  style={[styles.filterChip, isSelected && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                    {st}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Priority Filters */}
            {['High', 'Medium', 'Low'].map((pr) => {
              const isSelected = selectedPriority === pr;
              return (
                <TouchableOpacity
                  key={pr}
                  onPress={() => setSelectedPriority(isSelected ? 'All' : pr)}
                  style={[styles.filterChip, isSelected && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                    {pr} Priority
                  </Text>
                </TouchableOpacity>
              );
            })}

            {hasActiveFilters && (
              <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersBtn}>
                <Ionicons name="close" size={13} color={Colors.danger} />
                <Text style={styles.clearFiltersText}>Clear</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Items Content */}
          {items.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="checkbox-outline" size={44} color={Colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>Checklist is empty</Text>
              <Text style={styles.emptySubtitle}>
                {canEdit
                  ? 'Add the essentials, clothes, toiletries, and documents you need for this trip.'
                  : 'No items have been added to this trip yet.'}
              </Text>
              {canEdit && (
                <PrimaryButton
                  title="Add First Item"
                  onPress={() => {
                    setEditingItem(null);
                    setItemModalVisible(true);
                  }}
                  style={styles.addFirstBtn}
                />
              )}
            </View>
          ) : filteredItems.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No items match your filters.</Text>
              <TouchableOpacity onPress={clearFilters} style={styles.resetFiltersBtn}>
                <Text style={styles.resetFiltersText}>Reset Filters</Text>
              </TouchableOpacity>
            </View>
          ) : viewMode === 'category' ? (
            // Grouped By Category View
            categoryList.map((cat) => (
              <CategorySection
                key={cat}
                category={cat}
                items={groupedByCategory[cat]}
                isUnpackingMode={isUnpackingMode}
                isReadOnly={isViewer}
                onToggleStatus={handleToggleItemStatus}
                onEditItem={(item) => {
                  setEditingItem(item);
                  setItemModalVisible(true);
                }}
                onDeleteItem={handleDeleteItem}
              />
            ))
          ) : (
            // Flat All Items View
            filteredItems.map((item) => (
              <PackingItemCard
                key={item.itemId}
                item={item}
                isUnpackingMode={isUnpackingMode}
                isReadOnly={isViewer}
                onToggleStatus={handleToggleItemStatus}
                onEdit={(i) => {
                  setEditingItem(i);
                  setItemModalVisible(true);
                }}
                onDelete={handleDeleteItem}
              />
            ))
          )}
        </ScrollView>

        {/* Bottom Floating Add Item Button */}
        {items.length > 0 && canEdit && (
          <View style={styles.floatingBottom}>
            <PrimaryButton
              title="Add Item +"
              onPress={() => {
                setEditingItem(null);
                setItemModalVisible(true);
              }}
              style={styles.floatingAddBtn}
            />
          </View>
        )}
      </View>

      {/* Add / Edit Item Modal */}
      <AddItemModal
        visible={itemModalVisible}
        onClose={() => {
          setItemModalVisible(false);
          setEditingItem(null);
        }}
        onSubmit={handleItemSubmit}
        initialItem={editingItem}
        containers={containers}
        loading={submittingItem}
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
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  headerBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  headerIconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadge: {
    position: 'absolute',
    top: -5,
    right: -7,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  viewerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
  },
  viewerBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  collabBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  collabBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  collabBannerTextCol: {
    flex: 1,
  },
  collabBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369A1',
  },
  collabBannerSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  collabBannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  collabManageText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 90,
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
  tripMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  destinationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primarySurface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.full,
  },
  destinationPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.full,
  },
  metaPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  reminderPillActive: {
    backgroundColor: Colors.primarySurface,
    borderColor: Colors.primary,
    borderWidth: 1,
  },
  reminderPillTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  modeToggle: {
    marginBottom: 16,
  },
  progressCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  progressCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  progressCardCounts: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  progressCardPercent: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
  },
  progressCardPercentComplete: {
    color: Colors.success,
  },
  progressBarTrack: {
    height: 7,
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
  celebrationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radii.md,
    marginTop: 10,
  },
  celebrationText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
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
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.textInverse,
  },
  clearFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  clearFiltersText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.danger,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  addFirstBtn: {
    minWidth: 180,
  },
  noResultsContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  resetFiltersBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  resetFiltersText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  floatingBottom: {
    position: 'absolute',
    bottom: 18,
    left: 20,
    right: 20,
  },
  floatingAddBtn: {
    elevation: 4,
  },
  aiSuggestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: Radii.lg,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  aiSuggestIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  aiSuggestContent: {
    flex: 1,
  },
  aiSuggestTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  aiSuggestSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});

