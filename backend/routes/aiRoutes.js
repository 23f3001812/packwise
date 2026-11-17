const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/authMiddleware');
const aiController = require('../controllers/aiController');

// All AI recommendation routes require verified Firebase ID token
router.use(verifyFirebaseToken);

// Generate weather-aware checklist (Primary workflow)
router.post('/generate-weather-aware-checklist', aiController.generateWeatherAwareChecklist);

// Generate standard checklist without live weather
router.post('/generate-checklist', aiController.generateChecklist);

module.exports = router;

