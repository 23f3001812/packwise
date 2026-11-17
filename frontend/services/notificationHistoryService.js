import { get, post, request } from './api';

export const fetchNotifications = async () => {
  const response = await get('notifications', { requiresAuth: true });
  return response.data || [];
};

export const markNotificationAsRead = async (notificationId) => {
  const response = await request(`notifications/${notificationId}/read`, {
    method: 'PATCH',
    requiresAuth: true,
  });
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await request('notifications/mark-all-read', {
    method: 'PATCH',
    requiresAuth: true,
  });
  return response.data;
};

export const deleteNotification = async (notificationId) => {
  const response = await request(`notifications/${notificationId}`, {
    method: 'DELETE',
    requiresAuth: true,
  });
  return response.data;
};

export const clearAllNotifications = async () => {
  const response = await request('notifications/clear-all', {
    method: 'DELETE',
    requiresAuth: true,
  });
  return response.data;
};

export const fetchNotificationPreferences = async () => {
  const response = await get('notifications/preferences', { requiresAuth: true });
  return response.data;
};

export const updateNotificationPreferences = async (preferences) => {
  const response = await request('notifications/preferences', {
    method: 'PUT',
    body: preferences,
    requiresAuth: true,
  });
  return response.data;
};

export default {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  fetchNotificationPreferences,
  updateNotificationPreferences,
};

