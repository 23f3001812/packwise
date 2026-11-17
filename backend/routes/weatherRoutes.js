const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/authMiddleware');
const weatherController = require('../controllers/weatherController');

// All weather routes require verified Firebase ID token
router.use(verifyFirebaseToken);

// Forecast retrieval (supports POST and GET)
router.post('/forecast', weatherController.getForecast);
router.get('/forecast', weatherController.getForecast);

module.exports = router;

