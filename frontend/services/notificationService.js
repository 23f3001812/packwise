/**
 * PackWise Notification Service
 * Manages local notifications, channels, and trip reminders using expo-notifications.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Set default notification handler at module scope
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Initializes notification channels for Android.
 */
export const setupNotificationChannels = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('leave-behind', {
      name: 'Leave-Behind Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#14243E',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('trip-reminders', {
      name: 'Trip & Packing Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('default', {
      name: 'General Notifications',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
};

/**
 * Checks current notification permission status.
 */
export const getNotificationPermissionsStatus = async () => {
  try {
    const settings = await Notifications.getPermissionsAsync();
    return settings.granted || settings.status === 'granted';
  } catch (err) {
    console.warn('Failed to get notification permission status:', err.message);
    return false;
  }
};

/**
 * Requests notification permissions from user contextually.
 */
export const requestNotificationPermissions = async () => {
  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted || existing.status === 'granted') {
      return true;
    }
    const res = await Notifications.requestPermissionsAsync();
    return res.granted || res.status === 'granted';
  } catch (err) {
    console.warn('Notification permission request error:', err.message);
    return false;
  }
};

/**
 * Sends an immediate local notification (used for Leave-Behind Alerts and instant alerts).
 */
export const sendLocalNotification = async ({
  title,
  body,
  data = {},
  channelId = 'leave-behind',
}) => {
  try {
    await setupNotificationChannels();
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.warn('[NotificationService] Notification permission not granted.');
      return null;
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // triggers immediately
    });

    return id;
  } catch (err) {
    console.warn('[NotificationService] Failed to send local notification:', err.message);
    return null;
  }
};

/**
 * Schedules a trip reminder based on trip departure date.
 * Options: '1_day_before' | '3_days_before' | 'custom'
 */
export const scheduleTripReminder = async (trip, option = '1_day_before', customDate = null) => {
  try {
    if (!trip || !trip.startDate) {
      throw new Error('Trip does not have a valid start date.');
    }

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      throw new Error('Notification permission is required to schedule reminders.');
    }

    await setupNotificationChannels();

    let targetDate = null;
    let timingLabel = '';

    if (option === '1_day_before') {
      // 1 day before at 9:00 AM
      const start = new Date(trip.startDate);
      start.setDate(start.getDate() - 1);
      start.setHours(9, 0, 0, 0);
      targetDate = start;
      timingLabel = 'tomorrow';
    } else if (option === '3_days_before') {
      const start = new Date(trip.startDate);
      start.setDate(start.getDate() - 3);
      start.setHours(9, 0, 0, 0);
      targetDate = start;
      timingLabel = 'in 3 days';
    } else if (option === 'custom' && customDate) {
      targetDate = new Date(customDate);
      timingLabel = 'soon';
    }

    if (!targetDate || isNaN(targetDate.getTime())) {
      throw new Error('Invalid reminder date calculated.');
    }

    // Do not schedule for past dates
    if (targetDate.getTime() <= Date.now()) {
      throw new Error('Cannot schedule reminders for dates that have already passed.');
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Upcoming Trip: ${trip.eventName}`,
        body: `Your trip to ${trip.destination || 'your destination'} starts ${timingLabel}. Check your checklist to make sure everything is packed!`,
        data: {
          type: 'trip_reminder',
          listId: trip.listId,
        },
        channelId: 'trip-reminders',
      },
      trigger: {
        date: targetDate,
      },
    });

    return {
      success: true,
      notificationId,
      scheduledTime: targetDate.toISOString(),
      timingLabel,
    };
  } catch (err) {
    console.warn('[NotificationService] Failed to schedule trip reminder:', err.message);
    throw err;
  }
};

/**
 * Cancels a scheduled notification by its ID.
 */
export const cancelScheduledNotification = async (notificationId) => {
  try {
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      return true;
    }
  } catch (err) {
    console.warn('[NotificationService] Cancel error:', err.message);
  }
  return false;
};

export default {
  setupNotificationChannels,
  getNotificationPermissionsStatus,
  requestNotificationPermissions,
  sendLocalNotification,
  scheduleTripReminder,
  cancelScheduledNotification,
};

