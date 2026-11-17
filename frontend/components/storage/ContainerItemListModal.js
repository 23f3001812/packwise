import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radii } from '../../constants/theme';
import { fetchContainerItems } from '../../services/containerService';

export const ContainerItemListModal = ({ visible, container, onClose }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && container?.containerId) {
      loadItems();
    }
  }, [visible, container]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await fetchContainerItems(container.containerId);
      setItems(data);
    } catch (err) {
      console.warn('Failed to load container items:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {container?.containerName || 'Container Items'}
              </Text>
              <Text style={styles.modalSubtitle}>
                {container?.containerType} • {items.length} {items.length === 1 ? 'item' : 'items'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : items.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={42} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No items assigned</Text>
              <Text style={styles.emptySubtitle}>
                Open any packing checklist and assign items to this container.
              </Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            >
              {items.map((item) => (
                <View key={item.itemId} style={styles.itemRow}>
                  <View style={styles.itemBullet} />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>
                      {item.itemName} {item.quantity > 1 ? `(×${item.quantity})` : ''}
                    </Text>
                    <View style={styles.itemMeta}>
                      <Text style={styles.itemCategory}>{item.category || 'Other'}</Text>
                      <Text style={styles.dot}>•</Text>
                      <Text style={styles.itemList}>{item.listName}</Text>
                    </View>
                  </View>
                  {item.isPacked && (
                    <View style={styles.packedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                      <Text style={styles.packedText}>Packed</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity onPress={onClose} style={styles.doneBtn} activeOpacity={0.8}>
            <Text style={styles.doneBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingTop: 18,
    paddingBottom: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerTitleWrap: {
    flex: 1,
    paddingRight: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 10,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Radii.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  itemBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  itemCategory: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  dot: {
    fontSize: 11,
    color: Colors.textMuted,
    marginHorizontal: 4,
  },
  itemList: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500',
  },
  packedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  packedText: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '600',
  },
  doneBtn: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: Colors.backgroundSecondary,
    paddingVertical: 12,
    borderRadius: Radii.full,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});

export default ContainerItemListModal;

