/**
 * PackWise Gemini AI Service
 * Utilizes the official @google/genai SDK for structured packing checklist generation.
 */

const { GoogleGenAI, Type } = require('@google/genai');

// Strict JSON Schema for Gemini structured output
const packingListSchema = {
  type: Type.OBJECT,
  properties: {
    tripSummary: {
      type: Type.STRING,
      description: 'A concise 1-2 sentence overview of the trip, context, and packing focus.'
    },
    destination: {
      type: Type.STRING,
      description: 'The destination of the trip.'
    },
    durationDays: {
      type: Type.INTEGER,
      description: 'Total duration of the trip in days.'
    },
    weatherContext: {
      type: Type.OBJECT,
      properties: {
        available: { type: Type.BOOLEAN },
        summary: { type: Type.STRING }
      },
      required: ['available', 'summary']
    },
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: 'Concise name of the item (e.g., "Cotton T-Shirts", "Waterproof Jacket").'
          },
          category: {
            type: Type.STRING,
            description: 'Category must be one of: Clothing, Footwear, Toiletries, Electronics, Documents, Medicines, Accessories, Travel essentials, Food, Other.'
          },
          quantity: {
            type: Type.INTEGER,
            description: 'Realistic positive integer quantity for the trip duration.'
          },
          priority: {
            type: Type.STRING,
            description: 'Priority level: High, Medium, or Low.'
          },
          reason: {
            type: Type.STRING,
            description: 'Brief reason why this item is recommended.'
          },
          weatherRelated: {
            type: Type.BOOLEAN,
            description: 'True if recommended specifically due to destination weather conditions.'
          },
          essential: {
            type: Type.BOOLEAN,
            description: 'True if strictly essential for this type of trip.'
          }
        },
        required: ['name', 'category', 'quantity', 'priority', 'reason', 'weatherRelated', 'essential']
      }
    },
    generalTips: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '2 to 4 practical travel packing tips specific to this trip.'
    }
  },
  required: ['tripSummary', 'destination', 'durationDays', 'weatherContext', 'recommendations', 'generalTips']
};

/**
 * Builds the AI prompt for structured packing recommendations.
 */
function buildPrompt({
  destination,
  eventType,
  startDate,
  endDate,
  durationDays,
  activities = [],
  travellers = 1,
  preferences = '',
  notes = '',
  existingItems = [],
  weatherData = null
}) {
  const activitiesStr = activities && activities.length > 0 ? activities.join(', ') : 'General travel & leisure';
  const existingItemsStr =
    existingItems && existingItems.length > 0
      ? `\nIMPORTANT: The user already has the following items in their list:\n${existingItems.join(
          ', '
        )}\nDO NOT recommend duplicates of these items. Recommend complementary or missing necessities.`
      : '';

  let weatherSection = '';
  if (weatherData && weatherData.available) {
    weatherSection = `
LIVE DESTINATION WEATHER FORECAST:
- Destination: ${weatherData.destination}
- Weather Summary: ${weatherData.summary}
- Forecast Data: ${JSON.stringify(weatherData.dailyForecast)}
INSTRUCTION FOR WEATHER: Incorporate weather-smart recommendations (e.g. umbrella/waterproof layers if rain is forecast, breathable clothes/sunscreen/sunglasses for heat, thermal layers for cold). Mark weather-induced items with weatherRelated: true and explain the weather rationale.`;
  } else {
    const reason = weatherData?.reason || 'Live 5-day forecast not available for these dates';
    weatherSection = `
WEATHER FORECAST STATUS:
- Live 5-day weather forecast is currently unavailable (${reason}).
- Base your suggestions on the destination's typical seasonal climate, geographical conditions, and selected activities.
- Set weatherRelated: false for these items and explain recommendations based on general travel/climate appropriateness.`;
  }

  return `You are PackWise AI, an expert, context-aware travel packing consultant.
Your job is to generate a realistic, tailored, and high-quality packing checklist.

TRIP DETAILS:
- Destination: ${destination}
- Trip Type: ${eventType || 'Vacation'}
- Duration: ${durationDays} day(s) (${startDate || 'Not specified'} to ${endDate || 'Not specified'})
- Number of Travellers: ${travellers}
- Planned Activities: ${activitiesStr}
${preferences ? `- User Preferences: ${preferences}` : ''}
${notes ? `- Special Requirements/Notes: ${notes}` : ''}
${existingItemsStr}
${weatherSection}

GUIDELINES FOR RECOMMENDATIONS:
1. Generate between 14 and 26 carefully curated items.
2. Group items into ONLY these 10 categories: Clothing, Footwear, Toiletries, Electronics, Documents, Medicines, Accessories, Travel essentials, Food, Other.
3. Quantities must be practical and proportional to the ${durationDays}-day duration and ${travellers} traveler(s).
4. Assign Priority: "High" (critical must-haves), "Medium" (regular comfort/utility), or "Low" (nice-to-have).
5. Mark essential items with essential: true.
6. Provide a concise, helpful "reason" for each item.
7. Avoid duplicate items, unnecessary luxury fluff, or generic filler.
8. Output pure structured JSON adhering to the provided schema.`;
}

/**
 * Calls Gemini to generate a structured packing checklist.
 *
 * @param {object} tripDetails - Parameters for trip packing
 * @returns {Promise<object>} Structured AI response
 */
async function generateChecklistWithGemini(tripDetails) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim() || apiKey === 'your_gemini_api_key') {
    const error = new Error(
      'Gemini API key is not configured on the server. Please add GEMINI_API_KEY to backend/.env.'
    );
    error.statusCode = 503;
    error.code = 'GEMINI_NOT_CONFIGURED';
    throw error;
  }

  const primaryModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const apiVersion = process.env.GEMINI_API_VERSION || 'v1beta';
  const ai = new GoogleGenAI({
    apiKey,
    apiVersion,
    httpOptions: { apiVersion }
  });

  const prompt = buildPrompt(tripDetails);

  // Candidate models: Primary model first, followed by fallbacks for high-demand spikes
  const candidateModels = [primaryModel];
  ['gemini-2.0-flash', 'gemini-1.5-flash'].forEach((fallback) => {
    if (!candidateModels.includes(fallback)) {
      candidateModels.push(fallback);
    }
  });

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let lastError = null;

  for (let mIndex = 0; mIndex < candidateModels.length; mIndex++) {
    const currentModel = candidateModels[mIndex];
    const isLastModel = mIndex === candidateModels.length - 1;
    const maxAttempts = 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const timeoutMs = 30000;
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            const err = new Error('Gemini API request timed out after 30 seconds.');
            err.statusCode = 504;
            reject(err);
          }, timeoutMs);
        });

        const apiCallPromise = ai.models.generateContent({
          model: currentModel,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: packingListSchema,
            temperature: 0.2
          }
        });

        const response = await Promise.race([apiCallPromise, timeoutPromise]);

        if (!response || !response.text) {
          throw new Error('Empty response received from Gemini API.');
        }

        let cleanText = response.text.trim();
        if (cleanText.startsWith('```json')) {
          cleanText = cleanText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        } else if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
        }

        const parsed = JSON.parse(cleanText);
        return parsed;
      } catch (err) {
        lastError = err;

        // If client-side or authentication error, do not retry
        if (err.statusCode === 401 || (err.message && (err.message.includes('401') || err.message.toLowerCase().includes('api key')))) {
          const authErr = new Error('Invalid Gemini API key. Please check your credentials in backend/.env.');
          authErr.statusCode = 401;
          authErr.code = 'GEMINI_AUTH_ERROR';
          throw authErr;
        }

        const isTransient = err.message && (
          err.message.includes('503') ||
          err.message.includes('429') ||
          err.message.toLowerCase().includes('high demand') ||
          err.message.toLowerCase().includes('unavailable') ||
          err.message.toLowerCase().includes('quota')
        );

        if (isTransient) {
          if (attempt < maxAttempts) {
            console.warn(`[GeminiService] ${currentModel} attempt ${attempt} returned transient notice (${err.message}). Retrying in 1.5s...`);
            await sleep(1500);
            continue;
          } else if (!isLastModel) {
            console.warn(`[GeminiService] ${currentModel} busy. Falling back to next model (${candidateModels[mIndex + 1]})...`);
            break;
          }
        } else {
          if (isLastModel) break;
        }
      }
    }
  }

  if (lastError) {
    if (lastError.statusCode) throw lastError;

    if (lastError.message && (lastError.message.includes('429') || lastError.message.toLowerCase().includes('quota'))) {
      const quotaErr = new Error('Gemini API quota exceeded or rate limit reached. Please try again shortly.');
      quotaErr.statusCode = 429;
      quotaErr.code = 'GEMINI_QUOTA_EXCEEDED';
      throw quotaErr;
    }

    console.error('[GeminiService] All models exhausted. Generation error:', lastError.message);
    const wrapErr = new Error(`AI generation failed: ${lastError.message}`);
    wrapErr.statusCode = 502;
    throw wrapErr;
  }
}

module.exports = {
  generateChecklistWithGemini,
  buildPrompt
};

