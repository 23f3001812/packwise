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

const CONTAINER_TYPES = [
  'Suitcase',
  'Backpack',
  'Handbag',
  'Duffel bag',
  'Storage box',
  'Other',
];

export const ContainerModal = ({
  visible,
  onClose,
  onSubmit,
  initialContainer = null,
  loading = false,
}) => {
  const [containerName, setContainerName] = useState('');
  const [containerType, setContainerType] = useState('Suitcase');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialContainer) {
      setContainerName(initialContainer.containerName || '');
      setContainerType(initialContainer.containerType || 'Suitcase');
      setDescription(initialContainer.description || '');
      setCapacity(initialContainer.capacity || '');
    } else {
      setContainerName('');
      setContainerType('Suitcase');
      setDescription('');
      setCapacity('');
    }
    setErrors({});
  }, [initialContainer, visible]);

  const validate = () => {
    const newErrors = {};
    if (!containerName.trim()) {
      newErrors.containerName = 'Container name is required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onSubmit({
      containerName: containerName.trim(),
      containerType,
      description: description.trim(),
      capacity: capacity.trim() || null,
    });
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
              {initialContainer ? 'Edit Container' : 'Add Storage Container'}
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
            {/* Name */}
            <CustomInput
              label="Container Name *"
              value={containerName}
              onChangeText={(text) => {
                setContainerName(text);
                if (errors.containerName) setErrors({ ...errors, containerName: '' });
              }}
              placeholder="e.g. Blue Hardtop Suitcase, Tech Backpack"
              iconName="cube-outline"
              error={errors.containerName}
            />

            {/* Type Chips */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Container Type</Text>
              <View style={styles.chipsWrap}>
                {CONTAINER_TYPES.map((type) => {
                  const isSelected = containerType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setContainerType(type)}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Capacity */}
            <CustomInput
              label="Capacity (Optional)"
              value={capacity}
              onChangeText={setCapacity}
              placeholder="e.g. 25 kg, 45 Liters, 30x40 cm"
              iconName="scale-outline"
            />

            {/* Description */}
            <CustomInput
              label="Description (Optional)"
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Checked baggage for international travel"
              iconName="document-text-outline"
            />
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionsFooter}>
            <SecondaryButton title="Cancel" onPress={onClose} style={styles.cancelBtn} />
            <PrimaryButton
              title={initialContainer ? 'Save Changes' : 'Create Container'}
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
    maxHeight: '85%',
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
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
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

export default ContainerModal;

