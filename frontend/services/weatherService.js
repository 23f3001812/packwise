/**
 * PackWise Weather Service (Frontend Client)
 * Retrieves normalized travel-date aware weather forecasts from the backend.
 */

import { post } from './api';

/**
 * Fetches destination weather forecast for specified travel dates.
 *
 * @param {string} destination - City / Location name
 * @param {string|null} startDate - 'YYYY-MM-DD'
 * @param {string|null} endDate - 'YYYY-MM-DD'
 * @returns {Promise<object>} Normalized weather forecast
 */
export const fetchForecast = async (destination, startDate = null, endDate = null) => {
  const response = await post(
    'weather/forecast',
    { destination, startDate, endDate },
    { requiresAuth: true }
  );
  return response.data;
};

export default {
  fetchForecast
};

