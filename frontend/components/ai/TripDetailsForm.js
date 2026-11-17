import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radii } from '../../constants/theme';
import { CustomInput } from '../forms/CustomInput';
import { PrimaryButton } from '../buttons/PrimaryButton';
import { EVENT_TYPES, ACTIVITIES } from '../../constants/categories';

export const TripDetailsForm = ({
  initialValues = {},
  onSubmit,
  loading = false,
  submitLabel = 'Generate AI Packing List',
  isExistingList = false,
}) => {
  const [destination, setDestination] = useState(initialValues.destination || '');
  const [eventType, setEventType] = useState(initialValues.eventType || 'Vacation');
  const [startDate, setStartDate] = useState(initialValues.startDate || '');
  const [endDate, setEndDate] = useState(initialValues.endDate || '');
  const [travellers, setTravellers] = useState(initialValues.travellers || 1);
  const [selectedActivities, setSelectedActivities] = useState(
    initialValues.activities || ['Sightseeing']
  );
  const [preferences, setPreferences] = useState(initialValues.preferences || '');
  const [notes, setNotes] = useState(initialValues.notes || '');
  const [errors, setErrors] = useState({});

  const toggleActivity = (activity) => {
    if (selectedActivities.includes(activity)) {
      setSelectedActivities(selectedActivities.filter((a) => a !== activity));
    } else {
      setSelectedActivities([...selectedActivities, activity]);
    }
  };

  const validate = () => {
    const errs = {};
    if (!destination.trim()) {
      errs.destination = 'Destination is required.';
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (startDate && !dateRegex.test(startDate.trim())) {
      errs.startDate = 'Use format YYYY-MM-DD (e.g. 2026-12-15)';
    }

    if (endDate && !dateRegex.test(endDate.trim())) {
      errs.endDate = 'Use format YYYY-MM-DD (e.g. 2026-12-20)';
    }

    if (startDate && endDate && dateRegex.test(startDate) && dateRegex.test(endDate)) {
      if (new Date(endDate) < new Date(startDate)) {
        errs.endDate = 'End date cannot be earlier than start date.';
      }
    }

    if (travellers < 1) {
      errs.travellers = 'Travellers must be at least 1.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onSubmit({
      destination: destination.trim(),
      eventType,
      startDate: startDate.trim() || null,
      endDate: endDate.trim() || null,
      travellers,
      activities: selectedActivities,
      preferences: preferences.trim(),
      notes: notes.trim(),
    });
  };

  return (
    <View style={styles.container}>
      {/* Destination Field */}
      <CustomInput
        label="Destination *"
        value={destination}
        onChangeText={(text) => {
          setDestination(text);
          if (errors.destination) setErrors({ ...errors, destination: null });
        }}
        placeholder="e.g. Goa, India or Paris, France"
        leftIcon="location-outline"
        error={errors.destination}
      />

      {/* Event / Trip Type Selector */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionLabel}>Trip Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          {EVENT_TYPES.map((type) => {
            const isSelected = eventType === type;
            return (
              <TouchableOpacity
                key={type}
                onPress={() => setEventType(type)}
                style={[styles.chip, isSelected && styles.chipSelected]}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {type}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Dates Row */}
      <View style={styles.datesRow}>
        <View style={styles.dateCol}>
          <CustomInput
            label="Start Date"
            value={startDate}
            onChangeText={(text) => {
              setStartDate(text);
              if (errors.startDate) setErrors({ ...errors, startDate: null });
            }}
            placeholder="YYYY-MM-DD"
            leftIcon="calendar-outline"
            error={errors.startDate}
          />
        </View>

        <View style={styles.dateCol}>
          <CustomInput
            label="End Date"
            value={endDate}
            onChangeText={(text) => {
              setEndDate(text);
              if (errors.endDate) setErrors({ ...errors, endDate: null });
            }}
            placeholder="YYYY-MM-DD"
            leftIcon="calendar-outline"
            error={errors.endDate}
          />
        </View>
      </View>

      {/* Number of Travellers Stepper */}
      <View style={styles.travellersCard}>
        <View style={styles.travellersInfo}>
          <Text style={styles.travellersLabel}>Number of Travellers</Text>
          <Text style={styles.travellersSub}>Adjusts clothing & toiletries amounts</Text>
        </View>

        <View style={styles.stepperBox}>
          <TouchableOpacity
            onPress={() => setTravellers(Math.max(1, travellers - 1))}
            style={[styles.stepperBtn, travellers <= 1 && styles.stepperBtnDisabled]}
            disabled={travellers <= 1}
            activeOpacity={0.7}
          >
            <Ionicons name="remove" size={16} color={travellers <= 1 ? '#D1D5DB' : Colors.primary} />
          </TouchableOpacity>

          <Text style={styles.stepperCount}>{travellers}</Text>

          <TouchableOpacity
            onPress={() => setTravellers(travellers + 1)}
            style={styles.stepperBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Planned Activities Chips (Multi-select) */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionLabel}>Planned Activities</Text>
        <Text style={styles.sectionSub}>Select all that apply for tailored equipment</Text>
        <View style={styles.activityGrid}>
          {ACTIVITIES.map((act) => {
            const isSelected = selectedActivities.includes(act);
            return (
              <TouchableOpacity
                key={act}
                onPress={() => toggleActivity(act)}
                style={[styles.actChip, isSelected && styles.actChipSelected]}
                activeOpacity={0.7}
              >
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                )}
                <Text style={[styles.actChipText, isSelected && styles.actChipTextSelected]}>
                  {act}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Luggage / Travel Preferences */}
      <CustomInput
        label="Luggage Preferences (Optional)"
        value={preferences}
        onChangeText={setPreferences}
        placeholder="e.g. Carry-on only, lightweight, minimal shoes"
        leftIcon="briefcase-outline"
      />

      {/* Special Requirements / Notes */}
      <CustomInput
        label="Notes & Special Requirements (Optional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="e.g. Traveling with baby, need formal wear for dinner"
        leftIcon="document-text-outline"
        multiline
        numberOfLines={3}
      />

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <PrimaryButton
          title={submitLabel}
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  sectionBlock: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  chipsScroll: {
    flexDirection: 'row',
    marginTop: 6,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.full,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  datesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateCol: {
    flex: 1,
  },
  travellersCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: Radii.md,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  travellersInfo: {
    flex: 1,
    marginRight: 12,
  },
  travellersLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  travellersSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.full,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnDisabled: {
    backgroundColor: '#FAFAFA',
  },
  stepperCount: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    minWidth: 28,
    textAlign: 'center',
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.full,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  actChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  actChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  submitContainer: {
    marginTop: 12,
    marginBottom: 24,
  },
});

export default TripDetailsForm;

