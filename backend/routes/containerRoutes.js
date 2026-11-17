const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/authMiddleware');
const containerController = require('../controllers/containerController');

// All container routes require verified Firebase ID token
router.use(verifyFirebaseToken);

router.post('/', containerController.createContainer);
router.get('/', containerController.getContainers);
router.get('/:containerId', containerController.getContainerById);
router.put('/:containerId', containerController.updateContainer);
router.delete('/:containerId', containerController.deleteContainer);
router.get('/:containerId/items', containerController.getContainerItems);

module.exports = router;

