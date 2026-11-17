const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/authMiddleware');
const reminderController = require('../controllers/reminderController');

router.use(verifyFirebaseToken);

router.post('/', reminderController.createReminder);
router.get('/', reminderController.getReminders);
router.post('/evaluate-exit', reminderController.evaluateExit);
router.get('/:id', reminderController.getReminderById);
router.put('/:id', reminderController.updateReminder);
router.patch('/:id/toggle', reminderController.toggleReminderEnabled);
router.delete('/:id', reminderController.deleteReminder);

module.exports = router;

