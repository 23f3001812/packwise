const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

router.use(verifyFirebaseToken);

router.get('/', notificationController.getNotifications);
router.post('/', notificationController.createNotification);
router.patch('/mark-all-read', notificationController.markAllAsRead);
router.delete('/clear-all', notificationController.clearAllNotifications);
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

router.get('/preferences', notificationController.getPreferences);
router.put('/preferences', notificationController.updatePreferences);

module.exports = router;

