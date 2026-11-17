/**
 * PackWise Weather Service
 * Integrates with OpenWeatherMap APIs to provide travel-date aware forecast data.
 */

// In-memory cache for weather forecasts (TTL: 30 minutes)
const weatherCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000;

/**
 * Clean up expired cache items periodically.
 */
function cleanupCache() {
  const now = Date.now();
  for (const [key, item] of weatherCache.entries()) {
    if (now - item.timestamp > CACHE_TTL_MS) {
      weatherCache.delete(key);
    }
  }
}

/**
 * Safely fetches with timeout using native AbortController.
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Resolves a destination name into coordinates using OpenWeatherMap Geocoding API.
 */
async function geocodeDestination(destination, apiKey) {
  const cleanDest = destination.trim();
  const geocodeUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
    cleanDest
  )}&limit=1&appid=${apiKey}`;

  const res = await fetchWithTimeout(geocodeUrl);
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Invalid OpenWeatherMap API key. Please check your credentials.');
    }
    if (res.status === 429) {
      throw new Error('OpenWeatherMap API quota exceeded. Please try again later.');
    }
    throw new Error(`Geocoding failed with status ${res.status}`);
  }

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    // If complex string (e.g. "Baga Beach, Goa, India"), try first segment
    const firstSegment = cleanDest.split(',')[0].trim();
    if (firstSegment !== cleanDest) {
      return geocodeDestination(firstSegment, apiKey);
    }
    return null;
  }

  const { lat, lon, name, country, state } = data[0];
  const formattedName = [name, state, country].filter(Boolean).join(', ');
  return { lat, lon, name: formattedName, rawName: name, country };
}

/**
 * Formats a date object to 'YYYY-MM-DD' in local/UTC.
 */
function formatDateStr(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Fetches and normalizes weather forecast data for a destination and travel date window.
 * Respects OpenWeatherMap 5-day / 3-hour forecast constraints.
 * Never fabricates numbers for dates outside the forecast window.
 *
 * @param {string} destination - City/destination name
 * @param {string|null} startDate - 'YYYY-MM-DD'
 * @param {string|null} endDate - 'YYYY-MM-DD'
 * @returns {Promise<object>} Normalized weather forecast object
 */
async function getForecast(destination, startDate = null, endDate = null) {
  cleanupCache();

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey || !apiKey.trim() || apiKey === 'your_openweather_api_key') {
    return {
      available: false,
      destination: destination || '',
      reason: 'OpenWeatherMap API key is not configured in backend/.env.',
      dailyForecast: [],
      summary: 'Live weather forecast unavailable (API key not configured).'
    };
  }

  if (!destination || !destination.trim()) {
    return {
      available: false,
      destination: '',
      reason: 'Destination is required for weather forecast.',
      dailyForecast: [],
      summary: 'No destination provided.'
    };
  }

  const cacheKey = `${destination.toLowerCase().trim()}_${startDate || ''}_${endDate || ''}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    // 1. Geocode location
    const location = await geocodeDestination(destination, apiKey);
    if (!location) {
      const result = {
        available: false,
        destination,
        reason: `Could not locate coordinates for "${destination}". Please check the spelling.`,
        dailyForecast: [],
        summary: 'Location could not be found for weather forecast.'
      };
      weatherCache.set(cacheKey, { timestamp: Date.now(), data: result });
      return result;
    }

    // 2. Fetch 5-Day / 3-Hour Forecast
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${location.lat}&lon=${location.lon}&units=metric&appid=${apiKey}`;
    const res = await fetchWithTimeout(forecastUrl);
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Invalid OpenWeatherMap API key.');
      }
      if (res.status === 429) {
        throw new Error('OpenWeatherMap API quota exceeded.');
      }
      throw new Error(`OpenWeatherMap returned status ${res.status}`);
    }

    const rawData = await res.json();
    const list = rawData.list || [];
    if (list.length === 0) {
      const result = {
        available: false,
        destination: location.name,
        reason: 'No forecast data points returned by provider.',
        dailyForecast: [],
        summary: 'Forecast data unavailable.'
      };
      return result;
    }

    // Extract provider forecast range
    const availableDates = [...new Set(list.map((item) => item.dt_txt.split(' ')[0]))].sort();
    const earliestDate = availableDates[0];
    const latestDate = availableDates[availableDates.length - 1];

    // Date coverage validation
    const todayStr = formatDateStr(new Date());
    const tripStart = startDate ? startDate.trim() : todayStr;
    const tripEnd = endDate ? endDate.trim() : latestDate;

    // Condition 1: Entire trip is in the future beyond 5 days
    if (tripStart > latestDate) {
      const result = {
        available: false,
        destination: location.name,
        reason: `Trip dates (${tripStart} to ${tripEnd}) are outside the 5-day weather forecast window. Reliable live forecasts are available up to 5 days in advance (until ${latestDate}).`,
        forecastCoverage: {
          earliestDate,
          latestDate,
          requestedStart: tripStart,
          requestedEnd: tripEnd
        },
        dailyForecast: [],
        summary: `Forecast is not yet available for ${tripStart}. Live forecasts cover up to 5 days in advance.`
      };
      weatherCache.set(cacheKey, { timestamp: Date.now(), data: result });
      return result;
    }

    // Condition 2: Entire trip is in the past
    if (tripEnd < earliestDate) {
      const result = {
        available: false,
        destination: location.name,
        reason: `Trip dates (${tripStart} to ${tripEnd}) have already passed.`,
        forecastCoverage: null,
        dailyForecast: [],
        summary: 'Trip dates are in the past.'
      };
      weatherCache.set(cacheKey, { timestamp: Date.now(), data: result });
      return result;
    }

    // Filter 3-hour slots matching requested window
    // (If start date is before earliest, start from earliest; if end is beyond latest, end at latest)
    const filteredSlots = list.filter((slot) => {
      const slotDate = slot.dt_txt.split(' ')[0];
      return slotDate >= tripStart && slotDate <= tripEnd;
    });

    const slotsToUse = filteredSlots.length > 0 ? filteredSlots : list;

    // Group by date
    const dailyMap = {};
    for (const slot of slotsToUse) {
      const dateKey = slot.dt_txt.split(' ')[0];
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = [];
      }
      dailyMap[dateKey].push(slot);
    }

    // Aggregate into daily summaries
    const dailyForecast = Object.keys(dailyMap).sort().map((dateStr) => {
      const slots = dailyMap[dateStr];
      const temps = slots.map((s) => s.main?.temp).filter((t) => typeof t === 'number');
      const minTemps = slots.map((s) => s.main?.temp_min).filter((t) => typeof t === 'number');
      const maxTemps = slots.map((s) => s.main?.temp_max).filter((t) => typeof t === 'number');
      const pops = slots.map((s) => s.pop || 0);
      const humidities = slots.map((s) => s.main?.humidity).filter((h) => typeof h === 'number');
      const windSpeeds = slots.map((s) => s.wind?.speed).filter((w) => typeof w === 'number');

      // Find most common weather condition
      const descriptions = slots.map((s) => s.weather?.[0]?.description).filter(Boolean);
      const condCounts = {};
      descriptions.forEach((d) => { condCounts[d] = (condCounts[d] || 0) + 1; });
      const dominantDesc = Object.keys(condCounts).sort((a, b) => condCounts[b] - condCounts[a])[0] || 'Clear';

      const mainConds = slots.map((s) => s.weather?.[0]?.main).filter(Boolean);
      const mainCounts = {};
      mainConds.forEach((m) => { mainCounts[m] = (mainCounts[m] || 0) + 1; });
      const dominantMain = Object.keys(mainCounts).sort((a, b) => mainCounts[b] - mainCounts[a])[0] || 'Clear';

      const icon = slots[Math.floor(slots.length / 2)]?.weather?.[0]?.icon || '01d';

      const minTemp = minTemps.length ? Math.round(Math.min(...minTemps)) : Math.round(Math.min(...temps));
      const maxTemp = maxTemps.length ? Math.round(Math.max(...maxTemps)) : Math.round(Math.max(...temps));
      const avgTemp = temps.length ? Math.round(temps.reduce((a, b) => a + b, 0) / temps.length) : minTemp;
      const maxPop = pops.length ? Math.round(Math.max(...pops) * 100) : 0;
      const avgHum = humidities.length ? Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length) : 0;
      const maxWind = windSpeeds.length ? Math.round(Math.max(...windSpeeds)) : 0;

      return {
        date: dateStr,
        minTemperature: minTemp,
        maxTemperature: maxTemp,
        avgTemperature: avgTemp,
        condition: dominantMain,
        description: dominantDesc.charAt(0).toUpperCase() + dominantDesc.slice(1),
        icon,
        rainProbability: maxPop,
        humidity: avgHum,
        windSpeed: maxWind
      };
    });

    const isPartialCoverage = endDate ? endDate > latestDate : false;
    const coveredDates = dailyForecast.map((d) => d.date);
    const coveredStart = coveredDates[0];
    const coveredEnd = coveredDates[coveredDates.length - 1];

    // Compute overall summary
    const overallMin = Math.min(...dailyForecast.map((d) => d.minTemperature));
    const overallMax = Math.max(...dailyForecast.map((d) => d.maxTemperature));
    const maxRainChance = Math.max(...dailyForecast.map((d) => d.rainProbability));
    const conditions = [...new Set(dailyForecast.map((d) => d.condition))];

    let summaryText = `Temperatures ranging from ${overallMin}°C to ${overallMax}°C with ${conditions.join(', ').toLowerCase()}.`;
    if (maxRainChance >= 40) {
      summaryText += ` High probability of rain (${maxRainChance}%); rain gear recommended.`;
    } else if (maxRainChance >= 20) {
      summaryText += ` Slight chance of rain (${maxRainChance}%).`;
    } else {
      summaryText += ` Mostly dry conditions expected.`;
    }

    if (isPartialCoverage) {
      summaryText += ` (Forecast covers through ${coveredEnd}; later dates are outside the 5-day window).`;
    }

    const result = {
      available: true,
      destination: location.name,
      unit: 'metric',
      forecastCoverage: {
        startDate: coveredStart,
        endDate: coveredEnd,
        requestedStart: tripStart,
        requestedEnd: tripEnd,
        isPartialCoverage
      },
      dailyForecast,
      summary: summaryText,
      isPartialCoverage
    };

    weatherCache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  } catch (error) {
    console.error('[WeatherService] Error:', error.message);
    return {
      available: false,
      destination,
      reason: error.message || 'Failed to fetch weather forecast.',
      dailyForecast: [],
      summary: 'Live weather forecast currently unavailable.'
    };
  }
}

module.exports = {
  getForecast,
  geocodeDestination,
};

