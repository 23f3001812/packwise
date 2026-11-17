/**
 * PackWise AI API Service
 * Handles AI-powered checklist generation and batch item saving.
 */

import { post } from './api';

/**
 * Generates a personalized, weather-aware packing checklist using Gemini and OpenWeatherMap.
 *
 * @param {object} tripData - Destination, dates, activities, preferences, etc.
 * @returns {Promise<object>} Generated checklist with weather summary and recommendations
 */
export const generateWeatherAwareChecklist = async (tripData) => {
  const response = await post('ai/generate-weather-aware-checklist', tripData, {
    requiresAuth: true,
    timeoutMs: 60000 // 60s timeout for weather lookup + Gemini structured generation
  });
  return response.data;
};

/**
 * Generates an AI packing checklist without live weather forecast.
 *
 * @param {object} tripData - Destination, dates, activities, preferences, etc.
 * @returns {Promise<object>} Generated checklist recommendations
 */
export const generateChecklist = async (tripData) => {
  const response = await post('ai/generate-checklist', tripData, {
    requiresAuth: true,
    timeoutMs: 45000 // 45s timeout for Gemini structured generation
  });
  return response.data;
};

/**
 * Batch saves selected AI recommendations to a specific packing list in Firestore.
 *
 * @param {string} listId - Target packing list ID
 * @param {Array<object>} items - Array of items to save
 * @returns {Promise<object>} Save confirmation and added items count
 */
export const batchAddItemsToList = async (listId, items) => {
  const response = await post(
    `lists/${listId}/items/batch`,
    { items },
    { requiresAuth: true, timeoutMs: 25000 }
  );
  return response.data;
};

export default {
  generateWeatherAwareChecklist,
  generateChecklist,
  batchAddItemsToList
};

