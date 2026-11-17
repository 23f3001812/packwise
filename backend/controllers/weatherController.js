/**
 * PackWise Weather Controller
 * Handles weather forecast requests for destinations.
 */

const weatherService = require('../services/weatherService');

/**
 * POST /api/weather/forecast or GET /api/weather/forecast
 * Retrieves normalized travel-date aware forecast for destination.
 */
const getForecast = async (req, res, next) => {
  try {
    const destination = req.body.destination || req.query.destination;
    const startDate = req.body.startDate || req.query.startDate;
    const endDate = req.body.endDate || req.query.endDate;

    if (!destination || !destination.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Destination is required'
      });
    }

    const forecast = await weatherService.getForecast(destination, startDate, endDate);

    return res.status(200).json({
      success: true,
      data: forecast
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getForecast
};

