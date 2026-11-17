/**
 * PackWise Reminder Controller
 */

const reminderService = require('../services/reminderService');

const createReminder = async (req, res, next) => {
  try {
    const result = await reminderService.createReminder(req.user.uid, req.body);
    return res.status(201).json({
      success: true,
      message: 'Leave-behind reminder created',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getReminders = async (req, res, next) => {
  try {
    const reminders = await reminderService.getReminders(req.user.uid);
    return res.status(200).json({
      success: true,
      data: reminders,
    });
  } catch (error) {
    next(error);
  }
};

const getReminderById = async (req, res, next) => {
  try {
    const reminder = await reminderService.getReminderById(req.user.uid, req.params.id);
    return res.status(200).json({
      success: true,
      data: reminder,
    });
  } catch (error) {
    next(error);
  }
};

const updateReminder = async (req, res, next) => {
  try {
    const result = await reminderService.updateReminder(req.user.uid, req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Reminder updated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const toggleReminderEnabled = async (req, res, next) => {
  try {
    const { isEnabled } = req.body;
    const result = await reminderService.toggleReminderEnabled(req.user.uid, req.params.id, isEnabled);
    return res.status(200).json({
      success: true,
      message: `Reminder ${result.isEnabled ? 'enabled' : 'disabled'}`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteReminder = async (req, res, next) => {
  try {
    const result = await reminderService.deleteReminder(req.user.uid, req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Reminder deleted',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const evaluateExit = async (req, res, next) => {
  try {
    const { locationId } = req.body;
    if (!locationId) {
      return res.status(400).json({ success: false, error: 'locationId is required for evaluation.' });
    }
    const result = await reminderService.evaluateGeofenceExit(req.user.uid, locationId);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReminder,
  getReminders,
  getReminderById,
  updateReminder,
  toggleReminderEnabled,
  deleteReminder,
  evaluateExit,
};

