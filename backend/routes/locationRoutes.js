const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/authMiddleware');
const locationController = require('../controllers/locationController');

router.use(verifyFirebaseToken);

router.post('/', locationController.createLocation);
router.get('/', locationController.getLocations);
router.get('/:id', locationController.getLocationById);
router.put('/:id', locationController.updateLocation);
router.patch('/:id/toggle', locationController.toggleLocationActive);
router.delete('/:id', locationController.deleteLocation);

module.exports = router;

