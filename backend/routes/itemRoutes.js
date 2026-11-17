const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/authMiddleware');
const itemController = require('../controllers/itemController');

// All item routes require verified Firebase ID token
router.use(verifyFirebaseToken);

router.get('/:itemId', itemController.getItemById);
router.put('/:itemId', itemController.updateItem);
router.patch('/:itemId/status', itemController.updateItemStatus);
router.delete('/:itemId', itemController.deleteItem);

module.exports = router;

