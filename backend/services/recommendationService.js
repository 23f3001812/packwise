/**
 * PackWise Recommendation Service
 * Coordinates weather retrieval, prompt construction, Gemini AI generation,
 * item normalization, deduplication, and response preparation.
 */

const weatherService = require('./weatherService');
const geminiService = require('./geminiService');

const VALID_CATEGORIES = [
  'Clothing',
  'Footwear',
  'Toiletries',
  'Electronics',
  'Documents',
  'Medicines',
  'Accessories',
  'Travel essentials',
  'Food',
  'Other'
];

const VALID_PRIORITIES = ['High', 'Medium', 'Low'];

/**
 * Normalizes category string to match the 10 allowed categories.
 */
function normalizeCategory(cat) {
  if (!cat || typeof cat !== 'string') return 'Other';
  const trimmed = cat.trim();
  const directMatch = VALID_CATEGORIES.find((c) => c.toLowerCase() === trimmed.toLowerCase());
  if (directMatch) return directMatch;

  // Fuzzy mappings
  const lower = trimmed.toLowerCase();
  if (lower.includes('cloth') || lower.includes('wear') || lower.includes('apparel')) return 'Clothing';
  if (lower.includes('shoe') || lower.includes('boot') || lower.includes('foot') || lower.includes('sandal')) return 'Footwear';
  if (lower.includes('toiletr') || lower.includes('hygiene') || lower.includes('bath') || lower.includes('skincare')) return 'Toiletries';
  if (lower.includes('tech') || lower.includes('device') || lower.includes('gadget') || lower.includes('electron') || lower.includes('cable') || lower.includes('charger')) return 'Electronics';
  if (lower.includes('doc') || lower.includes('id') || lower.includes('passport') || lower.includes('ticket')) return 'Documents';
  if (lower.includes('med') || lower.includes('first aid') || lower.includes('pill') || lower.includes('health')) return 'Medicines';
  if (lower.includes('gear') || lower.includes('pack') || lower.includes('bag') || lower.includes('essential')) return 'Travel essentials';
  if (lower.includes('snack') || lower.includes('food') || lower.includes('drink') || lower.includes('water')) return 'Food';
  if (lower.includes('watch') || lower.includes('glass') || lower.includes('hat') || lower.includes('jewel') || lower.includes('access')) return 'Accessories';

  return 'Other';
}

/**
 * Normalizes priority string.
 */
function normalizePriority(pri) {
  if (!pri || typeof pri !== 'string') return 'Medium';
  const match = VALID_PRIORITIES.find((p) => p.toLowerCase() === pri.trim().toLowerCase());
  return match || 'Medium';
}

/**
 * Computes trip duration in days from start and end dates.
 */
function computeDurationDays(startDate, endDate) {
  if (!startDate || !endDate) return 4; // Sensible default
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 4;
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, Math.min(60, diffDays));
}

/**
 * Validates trip inputs provided by client.
 */
function validateTripInputs({ destination, startDate, endDate, travellers }) {
  if (!destination || !destination.trim()) {
    throw new Error('Destination is required for AI packing generation.');
  }

  if (startDate && endDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) {
      throw new Error('Dates must be valid ISO format (YYYY-MM-DD).');
    }
    if (e < s) {
      throw new Error('End date cannot be earlier than start date.');
    }
  }

  const parsedTravellers = parseInt(travellers, 10);
  if (travellers !== undefined && travellers !== null && (isNaN(parsedTravellers) || parsedTravellers < 1)) {
    throw new Error('Number of travellers must be a positive integer.');
  }
}

/**
 * Normalizes and deduplicates AI recommendations.
 */
function normalizeRecommendations(rawRecommendations) {
  if (!Array.isArray(rawRecommendations)) {
    return [];
  }

  const seenNames = new Set();
  const normalized = [];

  for (let i = 0; i < rawRecommendations.length; i++) {
    const item = rawRecommendations[i];
    if (!item || !item.name || typeof item.name !== 'string') continue;

    const trimmedName = item.name.trim();
    if (!trimmedName) continue;

    const lowerName = trimmedName.toLowerCase();
    if (seenNames.has(lowerName)) {
      // Merge quantity into previous item if duplicate
      const existing = normalized.find((n) => n.name.toLowerCase() === lowerName);
      if (existing && item.quantity) {
        existing.quantity += Math.max(1, parseInt(item.quantity, 10) || 1);
      }
      continue;
    }

    seenNames.add(lowerName);

    const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
    const category = normalizeCategory(item.category);
    const priority = normalizePriority(item.priority);
    const weatherRelated = Boolean(item.weatherRelated);
    const essential = Boolean(item.essential);
    const reason = item.reason && typeof item.reason === 'string' ? item.reason.trim() : 'Recommended for your trip';

    normalized.push({
      id: `rec_${i + 1}_${Date.now()}`,
      name: trimmedName,
      category,
      quantity,
      priority,
      reason,
      weatherRelated,
      essential,
      selected: true // Default checked for easy review
    });

    if (normalized.length >= 35) break; // Keep bounded
  }

  return normalized;
}

/**
 * Orchestrates weather forecast retrieval + Gemini generation.
 *
 * @param {object} tripDetails - Destination, dates, activities, etc.
 * @returns {Promise<object>} Unified recommendation response
 */
async function generateWeatherAwareChecklist(tripDetails) {
  validateTripInputs(tripDetails);

  const durationDays = computeDurationDays(tripDetails.startDate, tripDetails.endDate);

  // 1. Fetch live destination weather if possible
  const weatherStart = Date.now();
  let weatherData = null;
  console.log(`[RecommendationService] [WEATHER_START] Fetching weather forecast for "${tripDetails.destination}"...`);
  try {
    weatherData = await weatherService.getForecast(
      tripDetails.destination,
      tripDetails.startDate,
      tripDetails.endDate
    );
    const weatherElapsed = Date.now() - weatherStart;
    console.log(`[RecommendationService] [WEATHER_COMPLETE] Weather lookup finished in ${weatherElapsed}ms (available: ${weatherData.available})`);
  } catch (weatherErr) {
    const weatherElapsed = Date.now() - weatherStart;
    console.warn(`[RecommendationService] [WEATHER_NOTICE] Weather lookup warning after ${weatherElapsed}ms: ${weatherErr.message}`);
    weatherData = {
      available: false,
      destination: tripDetails.destination,
      reason: 'Could not fetch weather forecast at this time.',
      dailyForecast: [],
      summary: 'Live weather forecast currently unavailable.'
    };
  }

  // 2. Call Gemini with full trip and weather context
  const geminiStart = Date.now();
  console.log(`[RecommendationService] [GEMINI_START] Calling Gemini AI generation for "${tripDetails.destination}" (${durationDays} days)...`);
  const aiResponse = await geminiService.generateChecklistWithGemini({
    ...tripDetails,
    durationDays,
    weatherData
  });
  const geminiElapsed = Date.now() - geminiStart;
  console.log(`[RecommendationService] [GEMINI_COMPLETE] Gemini AI generation finished in ${geminiElapsed}ms`);

  // 3. Normalize & validate recommendations
  const recommendations = normalizeRecommendations(aiResponse.recommendations);
  console.log(`[RecommendationService] [NORMALIZED] Curated ${recommendations.length} recommendations`);

  return {
    tripSummary: aiResponse.tripSummary || `Custom packing checklist for ${tripDetails.destination}`,
    destination: tripDetails.destination,
    durationDays,
    weather: weatherData,
    recommendations,
    generalTips: Array.isArray(aiResponse.generalTips) ? aiResponse.generalTips.slice(0, 5) : []
  };
}

/**
 * Generates AI checklist without live weather forecast.
 */
async function generateStandardChecklist(tripDetails) {
  validateTripInputs(tripDetails);

  const durationDays = computeDurationDays(tripDetails.startDate, tripDetails.endDate);

  const geminiStart = Date.now();
  console.log(`[RecommendationService] [GEMINI_START] Calling Gemini AI for "${tripDetails.destination}" (${durationDays} days, no weather)...`);
  const aiResponse = await geminiService.generateChecklistWithGemini({
    ...tripDetails,
    durationDays,
    weatherData: {
      available: false,
      reason: 'Standard checklist requested without live weather sync.'
    }
  });
  const geminiElapsed = Date.now() - geminiStart;
  console.log(`[RecommendationService] [GEMINI_COMPLETE] Gemini AI generation finished in ${geminiElapsed}ms`);

  const recommendations = normalizeRecommendations(aiResponse.recommendations);
  console.log(`[RecommendationService] [NORMALIZED] Curated ${recommendations.length} recommendations`);

  return {
    tripSummary: aiResponse.tripSummary || `Packing checklist for ${tripDetails.destination}`,
    destination: tripDetails.destination,
    durationDays,
    weather: {
      available: false,
      reason: 'No weather requested'
    },
    recommendations,
    generalTips: Array.isArray(aiResponse.generalTips) ? aiResponse.generalTips.slice(0, 5) : []
  };
}

module.exports = {
  generateWeatherAwareChecklist,
  generateStandardChecklist,
  validateTripInputs,
  normalizeRecommendations,
  computeDurationDays
};
