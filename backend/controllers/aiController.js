/**
 * PackWise AI Controller
 * Handles HTTP requests for Gemini-powered packing recommendations.
 */

const recommendationService = require('../services/recommendationService');

/**
 * POST /api/ai/generate-weather-aware-checklist
 * Primary endpoint: Integrates destination weather forecast with Gemini AI recommendations.
 */
const generateWeatherAwareChecklist = async (req, res, next) => {
  const reqStart = Date.now();
  const safeDest = req.body?.destination ? String(req.body.destination).slice(0, 50) : 'Unspecified';
  console.log(`[AI Controller] [START] generateWeatherAwareChecklist for destination: "${safeDest}"`);

  try {
    const {
      destination,
      eventType,
      startDate,
      endDate,
      activities,
      travellers,
      preferences,
      notes,
      existingItems
    } = req.body;

    const result = await recommendationService.generateWeatherAwareChecklist({
      destination,
      eventType,
      startDate,
      endDate,
      activities,
      travellers,
      preferences,
      notes,
      existingItems
    });

    const elapsedMs = Date.now() - reqStart;
    console.log(`[AI Controller] [RESPONSE] generateWeatherAwareChecklist completed in ${elapsedMs}ms (${(elapsedMs / 1000).toFixed(2)}s) with ${result.recommendations?.length || 0} items -> HTTP 200`);

    if (res.headersSent || res.writableEnded) {
      return;
    }

    return res.status(200).json({
      success: true,
      message: 'Weather-aware packing checklist generated successfully',
      data: result
    });
  } catch (error) {
    const elapsedMs = Date.now() - reqStart;
    console.error(`[AI Controller] [ERROR] generateWeatherAwareChecklist failed after ${elapsedMs}ms:`, error.message);
    next(error);
  }
};

/**
 * POST /api/ai/generate-checklist
 * Standard AI generation without live weather forecast.
 */
const generateChecklist = async (req, res, next) => {
  const reqStart = Date.now();
  const safeDest = req.body?.destination ? String(req.body.destination).slice(0, 50) : 'Unspecified';
  console.log(`[AI Controller] [START] generateChecklist for destination: "${safeDest}"`);

  try {
    const {
      destination,
      eventType,
      startDate,
      endDate,
      activities,
      travellers,
      preferences,
      notes,
      existingItems
    } = req.body;

    const result = await recommendationService.generateStandardChecklist({
      destination,
      eventType,
      startDate,
      endDate,
      activities,
      travellers,
      preferences,
      notes,
      existingItems
    });

    const elapsedMs = Date.now() - reqStart;
    console.log(`[AI Controller] [RESPONSE] generateChecklist completed in ${elapsedMs}ms (${(elapsedMs / 1000).toFixed(2)}s) with ${result.recommendations?.length || 0} items -> HTTP 200`);

    if (res.headersSent || res.writableEnded) {
      return;
    }

    return res.status(200).json({
      success: true,
      message: 'Packing checklist generated successfully',
      data: result
    });
  } catch (error) {
    const elapsedMs = Date.now() - reqStart;
    console.error(`[AI Controller] [ERROR] generateChecklist failed after ${elapsedMs}ms:`, error.message);
    next(error);
  }
};

module.exports = {
  generateWeatherAwareChecklist,
  generateChecklist
};

