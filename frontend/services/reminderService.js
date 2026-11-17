import { get, post, request } from './api';

export const fetchReminders = async () => {
  const response = await get('reminders', { requiresAuth: true });
  return response.data || [];
};

export const createReminder = async (data) => {
  const response = await post('reminders', data, { requiresAuth: true });
  return response.data;
};

export const updateReminder = async (reminderId, updates) => {
  const response = await request(`reminders/${reminderId}`, {
    method: 'PUT',
    body: updates,
    requiresAuth: true,
  });
  return response.data;
};

export const toggleReminderEnabled = async (reminderId, isEnabled) => {
  const response = await request(`reminders/${reminderId}/toggle`, {
    method: 'PATCH',
    body: { isEnabled },
    requiresAuth: true,
  });
  return response.data;
};

export const deleteReminder = async (reminderId) => {
  const response = await request(`reminders/${reminderId}`, {
    method: 'DELETE',
    requiresAuth: true,
  });
  return response.data;
};

export const evaluateExit = async (locationId) => {
  const response = await post('reminders/evaluate-exit', { locationId }, { requiresAuth: true });
  return response.data;
};

export default {
  fetchReminders,
  createReminder,
  updateReminder,
  toggleReminderEnabled,
  deleteReminder,
  evaluateExit,
};

