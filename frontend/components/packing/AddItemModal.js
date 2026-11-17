import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radii } from '../../constants/theme';
import { CustomInput } from '../forms/CustomInput';
import { PrimaryButton } from '../buttons/PrimaryButton';
import { SecondaryButton } from '../buttons/SecondaryButton';

const CATEGORIES = [
  'Clothing',
  'Footwear',
  'Toiletries',
  'Electronics',
  'Documents',
  'Medicines',
  'Accessories',
  'Travel essentials',
  'Food',
  'Other',
];

const PRIORITIES = ['Low', 'Medium', 'High'];

export const AddItemModal = ({
  visible,
  onClose,
  onSubmit,
  initialItem = null,
  containers = [],
  loading = false,
}) => {
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Clothing');
  const [quantity, setQuantity] = useState('1');
  const [priority, setPriority] = useState('Medium');
  const [containerId, setContainerId] = useState(null);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialItem) {
      setItemName(initialItem.itemName || '');
      setCategory(initialItem.category || 'Clothing');
      setQuantity(String(initialItem.quantity || 1));
      setPriority(initialItem.priority || 'Medium');
      setContainerId(initialItem.containerId || null);
      setNotes(initialItem.notes || '');
    } else {
      setItemName('');
      setCategory('Clothing');
      setQuantity('1');
      setPriority('Medium');
      setContainerId(null);
      setNotes('');
    }
    setErrors({});
  }, [initialItem, visible]);

  const validate = () => {
    const newErrors = {};
    if (!itemName.trim()) {
      newErrors.itemName = 'Item name is required.';
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      newErrors.quantity = 'Quantity must be at least 1.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onSubmit({
      itemName: itemName.trim(),
      category,
      quantity: parseInt(quantity, 10),
      priority,
      containerId: containerId || null,
      notes: notes.trim(),
    });
  };

  const handleQtyChange = (delta) => {
    const current = parseInt(quantity, 10) || 1;
    const next = Math.max(1, current + delta);
    setQuantity(String(next));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {initialItem ? 'Edit Item' : 'Add Packing Item'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
            keyboardShouldPersistTaps="handled"
          >
            {/* Item Name */}
            <CustomInput
              label="Item Name *"
              value={itemName}
              onChangeText={(text) => {
                setItemName(text);
                if (errors.itemName) setErrors({ ...errors, itemName: '' });
              }}
              placeholder="e.g. Warm Jacket, Charger, Passport"
              iconName="cube-outline"
              error={errors.itemName}
            />

            {/* Quantity Stepper */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Quantity *</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  onPress={() => handleQtyChange(-1)}
                  style={styles.stepperBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={18} color={Colors.textPrimary} />
                </TouchableOpacity>

                <View style={styles.stepperValue}>
                  <Text style={styles.stepperValueText}>{quantity}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => handleQtyChange(1)}
                  style={styles.stepperBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={18} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>
              {errors.quantity ? <Text style={styles.errorText}>{errors.quantity}</Text> : null}
            </View>

            {/* Category Chips */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.chipsWrap}>
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Priority Selector */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Priority</Text>
              <View style={styles.priorityRow}>
                {PRIORITIES.map((p) => {
                  const isSelected = priority === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setPriority(p)}
                      style={[styles.priorityPill, isSelected && styles.priorityPillActive]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.priorityPillText,
                          isSelected && styles.priorityPillTextActive,
                        ]}
                      >
                        {p}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Container Assignment */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Assign to Container (Optional)</Text>
              <View style={styles.chipsWrap}>
                <TouchableOpacity
                  onPress={() => setContainerId(null)}
                  style={[styles.chip, containerId === null && styles.chipActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, containerId === null && styles.chipTextActive]}>
                    None / Unassigned
                  </Text>
                </TouchableOpacity>

                {containers.map((cont) => {
                  const isSelected = containerId === cont.containerId;
                  return (
                    <TouchableOpacity
                      key={cont.containerId}
                      onPress={() => setContainerId(cont.containerId)}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="briefcase-outline"
                        size={12}
                        color={isSelected ? Colors.textInverse : Colors.textSecondary}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {cont.containerName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Notes */}
            <CustomInput
              label="Notes (Optional)"
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Pack in side pouch, requires EU adapter"
              iconName="document-text-outline"
            />
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionsFooter}>
            <SecondaryButton title="Cancel" onPress={onClose} style={styles.cancelBtn} />
            <PrimaryButton
              title={initialItem ? 'Save Changes' : 'Add Item'}
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitBtn}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
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
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    maxHeight: '88%',
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  fieldSection: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 140,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 3,
  },
  stepperBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radii.sm,
  },
  stepperValue: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValueText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: 4,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.textInverse,
    fontWeight: '600',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityPill: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  priorityPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  priorityPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  priorityPillTextActive: {
    color: Colors.textInverse,
    fontWeight: '700',
  },
  actionsFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  cancelBtn: {
    flex: 1,
  },
  submitBtn: {
    flex: 2,
  },
});

export default AddItemModal;

