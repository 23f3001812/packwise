/**
 * PackWise Geofencing Service
 * Handles geofence registration, permission management, and background exit detection.
 * Defined at module scope to satisfy Expo Task Manager requirements.
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { evaluateExit } from './reminderService';
import { sendLocalNotification } from './notificationService';

export const PACKWISE_GEOFENCE_TASK = 'PACKWISE_GEOFENCE_BACKGROUND_TASK';

// Track last triggered timestamp per location to prevent duplicate triggers
const lastExitTriggerTime = {};
const EXIT_DEBOUNCE_MS = 60 * 1000; // 1 minute cooldown per location

/**
 * 1. DEFINE BACKGROUND TASK AT MODULE SCOPE
 * Expo Task Manager strictly requires task definitions at root module scope.
 */
TaskManager.defineTask(PACKWISE_GEOFENCE_TASK, async ({ data: { eventType, region }, error }) => {
  if (error) {
    console.warn(`[GeofenceTask] Background error: ${error.message}`);
    return;
  }

  try {
    const locationId = region.identifier;

    // We only trigger Leave-Behind Alerts on GEOFENCE EXIT
    if (eventType === Location.GeofencingEventType.Exit) {
      console.log(`[GeofenceTask] Exited geofence region: ${locationId}`);

      // Debounce check to prevent duplicate firing on boundary jitter
      const now = Date.now();
      if (lastExitTriggerTime[locationId] && now - lastExitTriggerTime[locationId] < EXIT_DEBOUNCE_MS) {
        console.log(`[GeofenceTask] Debounced exit trigger for ${locationId}`);
        return;
      }
      lastExitTriggerTime[locationId] = now;

      // Evaluate exit with backend
      const result = await evaluateExit(locationId);

      if (result && result.shouldNotify && Array.isArray(result.alerts)) {
        for (const alert of result.alerts) {
          await sendLocalNotification({
            title: alert.title || "Don't forget your belongings!",
            body: alert.body,
            data: {
              type: 'leave_behind',
              locationId,
              listId: alert.relatedListId,
            },
            channelId: 'leave-behind',
          });
        }
      }
    } else if (eventType === Location.GeofencingEventType.Enter) {
      console.log(`[GeofenceTask] Entered geofence region: ${locationId}`);
    }
  } catch (taskErr) {
    console.warn('[GeofenceTask] Processing error:', taskErr.message);
  }
});

/**
 * Checks foreground and background location permissions status.
 */
export const checkLocationPermissions = async () => {
  try {
    const foreground = await Location.getForegroundPermissionsAsync();
    const background = await Location.getBackgroundPermissionsAsync();

    return {
      foregroundGranted: foreground.granted || foreground.status === 'granted',
      backgroundGranted: background.granted || background.status === 'granted',
      foregroundStatus: foreground.status,
      backgroundStatus: background.status,
      canAskAgain: foreground.canAskAgain,
    };
  } catch (err) {
    console.warn('Failed to check location permissions:', err.message);
    return {
      foregroundGranted: false,
      backgroundGranted: false,
      foregroundStatus: 'undetermined',
      backgroundStatus: 'undetermined',
      canAskAgain: true,
    };
  }
};

/**
 * Contextually requests foreground and background location permissions.
 */
export const requestLocationPermissions = async () => {
  try {
    // 1. First request foreground permission
    const fg = await Location.requestForegroundPermissionsAsync();
    if (!fg.granted) {
      return {
        foregroundGranted: false,
        backgroundGranted: false,
        reason: 'Foreground location permission denied.',
      };
    }

    // 2. Request background permission
    const bg = await Location.requestBackgroundPermissionsAsync();
    return {
      foregroundGranted: true,
      backgroundGranted: bg.granted || bg.status === 'granted',
      backgroundStatus: bg.status,
    };
  } catch (err) {
    console.warn('Location permission request error:', err.message);
    return {
      foregroundGranted: false,
      backgroundGranted: false,
      reason: err.message,
    };
  }
};

/**
 * Registers geofencing regions for enabled saved locations.
 */
export const syncGeofences = async (locations = []) => {
  try {
    // Filter active locations with valid coordinates
    const activeLocations = locations.filter(
      (loc) => loc.isActive && typeof loc.latitude === 'number' && typeof loc.longitude === 'number'
    );

    const isTaskDefined = TaskManager.isTaskDefined(PACKWISE_GEOFENCE_TASK);
    if (!isTaskDefined) {
      console.warn('[Geofence] Task not defined.');
      return false;
    }

    if (activeLocations.length === 0) {
      // Unregister if no active geofences
      const hasStarted = await Location.hasStartedGeofencingAsync(PACKWISE_GEOFENCE_TASK).catch(
        () => false
      );
      if (hasStarted) {
        await Location.stopGeofencingAsync(PACKWISE_GEOFENCE_TASK);
        console.log('[Geofence] Stopped all geofencing as no active locations exist.');
      }
      return true;
    }

    const regions = activeLocations.map((loc) => ({
      identifier: loc.locationId,
      latitude: loc.latitude,
      longitude: loc.longitude,
      radius: loc.radius || 200,
      notifyOnEntry: false,
      notifyOnExit: true,
    }));

    // Start background geofencing with regions
    await Location.startGeofencingAsync(PACKWISE_GEOFENCE_TASK, regions);
    console.log(`[Geofence] Successfully registered ${regions.length} geofence regions.`);
    return true;
  } catch (err) {
    // Note: In Expo Go on physical device, background geofencing is restricted by Android OS.
    // Development builds support full background geofencing.
    console.warn('[Geofence] startGeofencing notice (expected in Expo Go):', err.message);
    return false;
  }
};

/**
 * Test simulation helper: Evaluates a geofence exit event manually
 * and triggers the exact leave-behind alert notification if items are unpacked.
 * Allows instant verification on physical device in Expo Go!
 */
export const simulateGeofenceExit = async (locationId) => {
  try {
    const result = await evaluateExit(locationId);

    if (result && result.shouldNotify && Array.isArray(result.alerts)) {
      for (const alert of result.alerts) {
        await sendLocalNotification({
          title: alert.title || "Don't forget your belongings!",
          body: alert.body,
          data: {
            type: 'leave_behind',
            locationId,
            listId: alert.relatedListId,
          },
          channelId: 'leave-behind',
        });
      }
      return {
        triggered: true,
        alerts: result.alerts,
        locationName: result.locationName,
      };
    } else {
      return {
        triggered: false,
        reason: result.reason || 'All items are marked packed.',
      };
    }
  } catch (err) {
    console.warn('Simulation error:', err.message);
    throw err;
  }
};

export default {
  PACKWISE_GEOFENCE_TASK,
  checkLocationPermissions,
  requestLocationPermissions,
  syncGeofences,
  simulateGeofenceExit,
};

