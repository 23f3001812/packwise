import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Header } from '../../components/common/Header';
import { TripDetailsForm } from '../../components/ai/TripDetailsForm';
import { AIProcessingIndicator } from '../../components/ai/AIProcessingIndicator';
import { generateWeatherAwareChecklist } from '../../services/aiService';

export default function AIAssistantScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const isExistingList = Boolean(params.listId);
  const targetListId = params.listId || null;

  let existingItemNames = [];
  if (params.existingItems) {
    try {
      existingItemNames = JSON.parse(params.existingItems);
    } catch (e) {
      existingItemNames = [];
    }
  }

  const [loading, setLoading] = useState(false);
  const [currentDestination, setCurrentDestination] = useState(params.destination || '');

  const initialValues = {
    destination: params.destination || '',
    eventType: params.eventType || 'Vacation',
    startDate: params.startDate || '',
    endDate: params.endDate || '',
    travellers: 1,
    activities: ['Sightseeing'],
    preferences: '',
    notes: '',
  };

  const handleGenerate = async (formData) => {
    setCurrentDestination(formData.destination);
    setLoading(true);

    try {
      const payload = {
        ...formData,
        existingItems: existingItemNames,
      };

      const result = await generateWeatherAwareChecklist(payload);

      // Navigate to review screen with generated recommendations
      router.push({
        pathname: '/ai/review',
        params: {
          listId: targetListId || '',
          eventName: params.eventName || `Trip to ${formData.destination}`,
          destination: formData.destination,
          eventType: formData.eventType,
          startDate: formData.startDate || '',
          endDate: formData.endDate || '',
          data: JSON.stringify(result),
        },
      });
    } catch (err) {
      console.warn('AI Generation Error:', err.message);

      let message = err.message || 'Failed to generate recommendations. Please try again.';
      if (err.message && err.message.includes('GEMINI_NOT_CONFIGURED')) {
        message = 'Google Gemini API key is not configured in backend/.env. Please configure GEMINI_API_KEY to enable AI recommendations.';
      }

      Alert.alert('AI Assistant Notice', message, [
        { text: 'OK' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={isExistingList ? 'AI Suggestions' : 'AI Packing Assistant'}
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
          {loading ? (
            <AIProcessingIndicator
              destination={currentDestination}
              onCancel={() => setLoading(false)}
            />
          ) : (
            <>
              {/* Introduction Banner */}
              <View style={styles.introBanner}>
                <Text style={styles.bannerTitle}>
                  {isExistingList
                    ? `Get AI suggestions for "${params.eventName || 'your trip'}"`
                    : 'Personalized & Weather-Aware Packing'}
                </Text>
                <Text style={styles.bannerSubtitle}>
                  Powered by Google Gemini and OpenWeatherMap. We analyze your destination,
                  travel dates, and planned activities to tailor the ideal packing checklist.
                </Text>
              </View>

              {/* Trip Form */}
              <TripDetailsForm
                initialValues={initialValues}
                onSubmit={handleGenerate}
                loading={loading}
                isExistingList={isExistingList}
                submitLabel={
                  isExistingList ? 'Find Missing Essentials' : 'Generate AI Packing List'
                }
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  introBanner: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
});

