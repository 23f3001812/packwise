/**
 * PackWise Notification Controller
 */

const notificationHistoryService = require('../services/notificationHistoryService');

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationHistoryService.getNotifications(req.user.uid);
    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

const createNotification = async (req, res, next) => {
  try {
    const result = await notificationHistoryService.createNotification(req.user.uid, req.body);
    return res.status(201).json({
      success: true,
      message: 'Notification recorded',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const result = await notificationHistoryService.markAsRead(req.user.uid, req.params.id);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationHistoryService.markAllAsRead(req.user.uid);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    const result = await notificationHistoryService.deleteNotification(req.user.uid, req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Notification deleted',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const clearAllNotifications = async (req, res, next) => {
  try {
    const result = await notificationHistoryService.clearAllNotifications(req.user.uid);
    return res.status(200).json({
      success: true,
      message: 'Notification history cleared',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getPreferences = async (req, res, next) => {
  try {
    const prefs = await notificationHistoryService.getUserPreferences(req.user.uid);
    return res.status(200).json({
      success: true,
      data: prefs,
    });
  } catch (error) {
    next(error);
  }
};

const updatePreferences = async (req, res, next) => {
  try {
    const prefs = await notificationHistoryService.updateUserPreferences(req.user.uid, req.body);
    return res.status(200).json({
      success: true,
      message: 'Preferences updated',
      data: prefs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getPreferences,
  updatePreferences,
};

