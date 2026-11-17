import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radii } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { CustomInput } from '../../components/forms/CustomInput';
import { PrimaryButton } from '../../components/buttons/PrimaryButton';
import { createPackingList, updatePackingList } from '../../services/packingService';

const EVENT_TYPES = [
  'Vacation',
  'Business trip',
  'College',
  'Relocation',
  'Daily essentials',
  'Special occasion',
  'Other',
];

export default function CreatePackingListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isEditing = params.editMode === 'true';

  const [eventName, setEventName] = useState(params.eventName || '');
  const [destination, setDestination] = useState(params.destination || '');
  const [eventType, setEventType] = useState(params.eventType || 'Vacation');
  const [startDate, setStartDate] = useState(params.startDate || '');
  const [endDate, setEndDate] = useState(params.endDate || '');
  const [description, setDescription] = useState(params.description || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!eventName.trim()) {
      newErrors.eventName = 'Event or trip name is required.';
    }

    if (!destination.trim()) {
      newErrors.destination = 'Destination is required.';
    }

    // Validate date format YYYY-MM-DD if provided
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (startDate && !dateRegex.test(startDate.trim())) {
      newErrors.startDate = 'Use format YYYY-MM-DD (e.g. 2026-12-15).';
    }

    if (endDate && !dateRegex.test(endDate.trim())) {
      newErrors.endDate = 'Use format YYYY-MM-DD (e.g. 2026-12-20).';
    }

    if (startDate && endDate && dateRegex.test(startDate) && dateRegex.test(endDate)) {
      if (new Date(endDate) < new Date(startDate)) {
        newErrors.endDate = 'End date cannot be earlier than start date.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        eventName: eventName.trim(),
        destination: destination.trim(),
        eventType,
        startDate: startDate.trim() || null,
        endDate: endDate.trim() || null,
        description: description.trim(),
      };

      if (isEditing) {
        await updatePackingList(params.listId, payload);
        Alert.alert('Success', 'Packing list updated successfully.');
        router.back();
      } else {
        const created = await createPackingList(payload);
        // Navigate directly to the newly created list checklist
        router.replace(`/lists/${created.listId}`);
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save packing list.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={isEditing ? 'Edit Packing List' : 'Create Packing List'}
        showBack={true}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* AI Generation Banner */}
          {!isEditing && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: '/ai',
                  params: {
                    eventName,
                    destination,
                    eventType,
                    startDate,
                    endDate,
                  },
                })
              }
              style={styles.aiOptionCard}
            >
              <View style={styles.aiOptionIcon}>
                <Ionicons name="sparkles" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.aiOptionContent}>
                <Text style={styles.aiOptionTitle}>Generate with AI Assistant</Text>
                <Text style={styles.aiOptionSub}>
                  Let Gemini & OpenWeatherMap auto-curate tailored items for this trip.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
            </TouchableOpacity>
          )}

          {/* Trip / Event Name */}
          <CustomInput
            label="Event or Trip Name *"
            value={eventName}
            onChangeText={(text) => {
              setEventName(text);
              if (errors.eventName) setErrors({ ...errors, eventName: '' });
            }}
            placeholder="e.g. Goa Vacation, Berlin Conference"
            iconName="airplane-outline"
            error={errors.eventName}
          />

          {/* Destination */}
          <CustomInput
            label="Destination *"
            value={destination}
            onChangeText={(text) => {
              setDestination(text);
              if (errors.destination) setErrors({ ...errors, destination: '' });
            }}
            placeholder="e.g. Goa, India or Tokyo, Japan"
            iconName="location-outline"
            error={errors.destination}
          />

          {/* Event Type */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Event Type</Text>
            <View style={styles.chipsWrap}>
              {EVENT_TYPES.map((type) => {
                const isSelected = eventType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setEventType(type)}
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

          {/* Start Date */}
          <CustomInput
            label="Start Date (Optional)"
            value={startDate}
            onChangeText={(text) => {
              setStartDate(text);
              if (errors.startDate) setErrors({ ...errors, startDate: '' });
            }}
            placeholder="YYYY-MM-DD (e.g. 2026-12-15)"
            iconName="calendar-outline"
            keyboardType="numbers-and-punctuation"
            error={errors.startDate}
          />

          {/* End Date */}
          <CustomInput
            label="End Date (Optional)"
            value={endDate}
            onChangeText={(text) => {
              setEndDate(text);
              if (errors.endDate) setErrors({ ...errors, endDate: '' });
            }}
            placeholder="YYYY-MM-DD (e.g. 2026-12-20)"
            iconName="calendar-outline"
            keyboardType="numbers-and-punctuation"
            error={errors.endDate}
          />

          {/* Description */}
          <CustomInput
            label="Description / Trip Notes (Optional)"
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. Flight 6E-204, beach holiday with friends"
            iconName="document-text-outline"
          />

          {/* Submit Button */}
          <PrimaryButton
            title={isEditing ? 'Save Changes' : 'Create List & Add Items'}
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  fieldSection: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    marginLeft: 2,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 13,
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
  submitBtn: {
    marginTop: 16,
  },
  aiOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: Radii.lg,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  aiOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  aiOptionContent: {
    flex: 1,
    marginRight: 8,
  },
  aiOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  aiOptionSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
});

