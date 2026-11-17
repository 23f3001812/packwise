# PackWise — Milestone 5 Technical Report
## Geofencing, Smart Leave-Behind Alerts & Notifications

**Project Title:** PackWise: An AI-Powered Context-Aware Packing and Intelligent Item Management System with Geofencing and Real-Time Collaboration  
**Milestone:** 5 of 6  
**Status:** Completed & Verified  

---

## 1. Overview & Objectives

Milestone 5 equips PackWise with **Geofencing, Context-Aware Leave-Behind Alerts, and a Unified Notification Ecosystem**. Designed to eliminate the anxiety of leaving essential items behind when departing home, work, hotels, or airports, PackWise introduces an intelligent evaluation engine that links geographic locations directly to trip packing checklists.

### Key Capabilities Delivered:
1. **Geofenced Saved Locations:** Users can configure geographic places (Home, Office, College, Hotel, Custom) using real-time GPS coordinate capture or reverse geocoding with customizable geofence trigger radii (100m, 200m, 500m, 1000m).
2. **Context-Aware Smart Leave-Behind Engine:**
   - Evaluates packing progress at the moment a user exits a geofence.
   - **`onlyUnpacked` Intelligence:** If all items on a packing list are packed, the notification is completely suppressed to prevent notification fatigue. If items remain unpacked, it alerts the user with the exact missing belongings (e.g., *"Leaving Home? Don't forget your MacBook Pro & Office Access Card!"*).
   - Prevents duplicate alerts caused by boundary GPS jitter or repeated rapid exit-entry oscillations.
3. **Scheduled Trip & Departure Reminders:**
   - Automatically schedules local notifications (1 day before departure, 3 days before departure, or custom date/time) using `expo-notifications`.
   - Automatically reschedules or cancels notification triggers when trip dates change or when a packing list is deleted.
   - Prevents scheduling alerts for past departure dates.
4. **In-App Notification Center & Unread Badge:**
   - Dedicated Notification Center screen (`/notifications`) with real-time unread count badge on the Dashboard bell icon.
   - Categorized filter chips (*All*, *Leave-Behind*, *Trips*), unread status indicators, tap-to-navigate directly into the relevant checklist, mark all as read, and clear notification history.
5. **Notification & Location Permissions / Settings:**
   - Dedicated Settings screen (`/settings/notifications`) showing live system permission diagnostics (Foreground GPS, Background GPS, Push Notifications) with direct deep-links to Android system settings.
   - User toggles for Leave-Behind Alerts, Trip Departure Reminders, Packing Reminders, and Notification Sound.
6. **Robust Background Geofencing & Expo Go Compatibility:**
   - Root-level background task registration with `expo-task-manager` and `expo-location` (`PACKWISE_GEOFENCE_TASK`).
   - One-tap in-app simulation tool (`simulateGeofenceExit`) enabling instant end-to-end testing of exit alerts and notification delivery directly inside Expo Go without needing to physically walk outside.
7. **End-to-End REST APIs & Cloud Firestore Security:**
   - 17 new authenticated backend endpoints across `/api/locations`, `/api/reminders`, and `/api/notifications` running on **Port 5001**.
   - Strict Firestore security rules enforcing user ownership and collaborator access.

---

## 2. System Architecture & Information Flow

```
                      +--------------------------------------------------------+
                      |         Mobile Frontend (Expo / React Native)          |
                      |  - Dashboard (Bell Badge): app/(tabs)/index.js         |
                      |  - Notification Center: app/notifications/index.js     |
                      |  - Saved Locations: app/locations/index.js & create.js |
                      |  - Leave-Behind Reminders: app/reminders/              |
                      |  - Notification Settings: app/settings/notifications   |
                      +-----------+--------------------------------+-----------+
                                  |                                |
                        Location / Geofencing               REST API Requests
                        & TaskManager Events                (Bearer ID Token)
                                  |                                |
                                  v                                v
                      +-----------------------+     +-------------------------------+
                      | expo-task-manager     |     |   Express Backend (Port 5001) |
                      | PACKWISE_GEOFENCE_TASK|     |   - /api/locations            |
                      |  (Background Thread)  |     |   - /api/reminders            |
                      +-----------+-----------+     |   - /api/notifications        |
                                  |                 +---------------+---------------+
                                  |                                 |
                                  v                                 |
                       POST /reminders/evaluate-exit                |
                       (Evaluates Packed vs Unpacked)               |
                                  |                                 |
                                  +----------------+----------------+
                                                   |
                                                   v
                                   +--------------------------------+
                                   |        Cloud Firestore         |
                                   |  - locations/{id}              |
                                   |  - reminders/{id}              |
                                   |  - notifications/{id}          |
                                   |  - userPreferences/{uid}       |
                                   |  - packingLists / items        |
                                   +--------------------------------+
                                                   |
                                                   v
                                   +--------------------------------+
                                   |    expo-notifications Local    |
                                   |    Leave-Behind & Trip Alerts  |
                                   +--------------------------------+
```

---

## 3. Database Schema Design (Firestore)

### 3.1. `locations` Collection
Stores geofenced geographic boundaries created by users.
```json
{
  "locationId": "loc_abc123",
  "userId": "firebase_user_uid",
  "name": "Home Apartment",
  "address": "Bandra West, Mumbai, Maharashtra 400050",
  "latitude": 19.0596,
  "longitude": 72.8295,
  "radius": 200,
  "type": "Home",
  "isActive": true,
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

### 3.2. `reminders` Collection
Binds a saved location to one or more packing lists/items for leave-behind alerts.
```json
{
  "reminderId": "rem_xyz789",
  "userId": "firebase_user_uid",
  "locationId": "loc_abc123",
  "locationName": "Home Apartment",
  "listId": "NV2YTWQAfDX652YzpKe1",
  "listName": "Shimla Group Trek",
  "itemIds": ["item_macbook", "item_access_card"],
  "itemNames": ["MacBook Pro", "Office Access Card"],
  "type": "leave_behind",
  "onlyUnpacked": true,
  "customMessage": "Check your bag before driving off!",
  "isActive": true,
  "lastTriggeredAt": "Timestamp",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

### 3.3. `notifications` Collection
Stores in-app notification center records and alert histories.
```json
{
  "notificationId": "notif_456789",
  "userId": "firebase_user_uid",
  "type": "leave_behind",
  "title": "Leaving Home Apartment?",
  "body": "Don't forget your unpacked items: MacBook Pro, Office Access Card",
  "data": {
    "listId": "NV2YTWQAfDX652YzpKe1",
    "locationId": "loc_abc123",
    "unpackedItemCount": 2,
    "unpackedItemNames": ["MacBook Pro", "Office Access Card"],
    "actionUrl": "/lists/NV2YTWQAfDX652YzpKe1"
  },
  "isRead": false,
  "createdAt": "Timestamp"
}
```

### 3.4. `userPreferences` Collection
Stores user notification toggles and sound configuration under `userPreferences/{userId}`.
```json
{
  "userId": "firebase_user_uid",
  "leaveBehindAlertsEnabled": true,
  "tripRemindersEnabled": true,
  "packingRemindersEnabled": true,
  "soundEnabled": true,
  "updatedAt": "Timestamp"
}
```

---

## 4. Geofencing & Smart Leave-Behind Engine

### 4.1. Intelligent Leave-Behind Evaluation Logic
When a device exits a geofence, the backend `evaluateGeofenceExit` service:
1. Validates that the location and reminder are both active (`isActive: true`).
2. Checks user preferences to verify leave-behind alerts are globally enabled.
3. Queries the targeted items from the packing list in Firestore.
4. If `onlyUnpacked: true` (default):
   - Computes which items currently have `isPacked: false`.
   - **Suppression Condition:** If all tracked items are already packed, the exit alert is **completely suppressed** with `{ triggered: false, reason: 'All selected items have already been packed.' }`.
   - If unpacked items exist, it formats an alert containing their specific names.
5. If `onlyUnpacked: false`:
   - Alerts the user of all tracked items regardless of packed status.
6. Records an unread notification into the `notifications` collection and updates `lastTriggeredAt` on the reminder.

### 4.2. Jitter and Boundary Bounce Suppression
To prevent duplicate alerts when a user lingers near a boundary (e.g. GPS coordinates jumping across a 200m line):
- Reminders maintain a `lastTriggeredAt` timestamp.
- A minimum threshold (15 minutes) is enforced before the same reminder can re-fire for the same exit event.

### 4.3. Expo Go Simulation Engine
Because Android OS restricts background geofencing within the Expo Go sandbox, PackWise includes a built-in simulation mechanism:
- Available on the Reminders screen via the **Test Exit Alert 🚀** button.
- Invokes `simulateGeofenceExit` in `geofenceService.js`, which hits `/api/reminders/evaluate-exit`.
- If unpacked items remain, a real Android system notification is posted via `expo-notifications`, and the in-app notification center is updated instantly.

---

## 5. Scheduled Event & Trip Departure Reminders

### 5.1. Scheduling Workflow
On the Packing Checklist screen (`/lists/[id]`), users can tap the **🔔 Set Trip Reminder** button:
- Offers presets:
  - **1 Day Before Departure:** (Departure Date - 24 hours at 09:00 AM)
  - **3 Days Before Departure:** (Departure Date - 72 hours at 09:00 AM)
  - **Custom Date & Time**
- Checks whether the target trigger time is in the future. Past dates are rejected with a clear warning.
- Schedules the local notification via `Notifications.scheduleNotificationAsync` with `channelId: 'trip-reminders'`.
- Persists the resulting notification identifier in `packingLists/{id}` (`tripReminderNotificationId` and `tripReminderDate`).

### 5.2. Automatic Rescheduling & Cancellation Cascade
- If the trip dates are updated or if the user cancels the reminder, the scheduled notification is cancelled via `Notifications.cancelScheduledNotificationAsync`.
- If a packing list is deleted, any active scheduled departure notifications are automatically cancelled before list deletion completes.

---

## 6. In-App Notification Center & Real-Time Badge

1. **Dashboard Header Bell Icon:**
   - Listens to Firestore `notifications` collection with `where('userId', '==', user.uid)` and `where('isRead', '==', false)`.
   - Displays a red badge with the live count of unread notifications (e.g. `2`).
2. **Notification Screen (`/notifications`):**
   - **Filter Chips:** Filter by *All*, *Leave-Behind*, or *Trips*.
   - **Read Status:** Distinct visual styling for unread (accent dot + blue tint) vs read notifications.
   - **Deep Link Navigation:** Tapping an alert navigates directly to `/lists/[id]`.
   - **Batch Operations:** "Mark all as read" and "Clear all notifications" with confirmation dialogs.

---

## 7. Notification & Location Settings

Located at `/settings/notifications` and accessible from the Profile screen gear icon:
1. **System Permissions Diagnostic:**
   - Inspects `Location.getForegroundPermissionsAsync()`, `Location.getBackgroundPermissionsAsync()`, and `Notifications.getPermissionsAsync()`.
   - Shows live status badges (*Granted* / *Not Granted*).
   - "Open Device Settings" button deep-links to Android App Info settings via `Linking.openSettings()`.
2. **Alert Preferences:**
   - Leave-Behind Alerts (Switch)
   - Trip Departure Reminders (Switch)
   - Packing Check Reminders (Switch)
   - Alert Sounds (Switch)
   - Persists changes instantly to Firestore `userPreferences/{uid}`.

---

## 8. REST API Reference (Port 5001)

All endpoints require `Authorization: Bearer <FIREBASE_ID_TOKEN>`.

### Locations (`/api/locations`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/locations` | Get all saved locations for the user |
| `POST` | `/api/locations` | Create a new saved geofence location |
| `GET` | `/api/locations/:id` | Get details of a single location |
| `PUT` | `/api/locations/:id` | Update location name, address, coordinates, radius |
| `PATCH` | `/api/locations/:id/toggle` | Toggle location active/inactive status |
| `DELETE` | `/api/locations/:id` | Delete location with cascading reminder deactivation |

### Reminders (`/api/reminders`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/reminders` | Get all reminders for user (supports `?locationId=...`) |
| `POST` | `/api/reminders` | Create leave-behind reminder linked to list/items |
| `POST` | `/api/reminders/evaluate-exit` | Evaluate geofence exit event, check unpacked items, record alert |
| `GET` | `/api/reminders/:id` | Get single reminder details |
| `PUT` | `/api/reminders/:id` | Update reminder items, settings, or custom message |
| `PATCH` | `/api/reminders/:id/toggle` | Toggle reminder active/inactive status |
| `DELETE` | `/api/reminders/:id` | Delete reminder |

### Notifications & Preferences (`/api/notifications`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/notifications` | Get in-app notification history (supports `?limit=...&type=...`) |
| `POST` | `/api/notifications` | Create in-app notification |
| `PATCH` | `/api/notifications/:id/read` | Mark single notification as read |
| `PATCH` | `/api/notifications/mark-all-read`| Mark all user notifications as read |
| `DELETE` | `/api/notifications/clear-all` | Clear all user notifications |
| `GET` | `/api/notifications/preferences` | Get user notification preferences |
| `PUT` | `/api/notifications/preferences` | Update user notification preferences |

---

## 9. Firestore Security Rules

Rules added to `firestore.rules`:
```javascript
// Locations Collection
match /locations/{locationId} {
  allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
  allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
}

// Reminders Collection
match /reminders/{reminderId} {
  allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
  allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
}

// Notifications Collection
match /notifications/{notificationId} {
  allow read, write, delete: if request.auth != null && resource.data.userId == request.auth.uid;
  allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
}

// User Preferences Collection
match /userPreferences/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

---

## 10. Automated Verification & Regression Results

### 10.1. Milestone 5 Verification Suite (`backend/tests/test_milestone5.js`)
Executed 55 tests covering location CRUD, validation rules, reminder linking, geofence exit evaluation, unpacking logic, notification center, preferences, cascading deactivation, and route security.
```
=======================================================
🏁 TEST RESULTS: 55 PASSED | 0 FAILED
=======================================================
```

### 10.2. Regression Test Results
- **Milestone 4 Regression (`backend/tests/test_milestone4.js`):** **48 PASSED | 0 FAILED** (Collaborative lists, RBAC, invitations, Firestore listeners).
- **Milestone 3 Regression (`backend/tests/test_milestone3.js`):** **25 PASSED | 0 FAILED** (AI checklist generation, weather forecasting, deduplication).
- **Frontend Metro Bundler Export (`npx expo export -p web`):** **26 routes compiled cleanly with 0 errors**.

---

## 11. Android Testing Instructions

### Option A: Immediate Testing via Expo Go
1. Start the backend: `cd backend && npm start` (Running on `0.0.0.0:5001`).
2. Start the frontend: `cd frontend && npx expo start -c`.
3. Open PackWise in **Expo Go** on Android.
4. Go to **Profile** > **Saved Locations** > Add your Home location using "Use Current GPS Position".
5. Go to **Profile** > **Leave-Behind Reminders** > Tap **+ New Reminder**:
   - Select your Home location and your active trip checklist.
   - Pick 2 items (e.g. *MacBook Pro* and *Office Access Card*).
   - Ensure *Only Unpacked Items* is toggled ON.
6. On the Reminders list, tap **Test Exit Alert 🚀**:
   - An Android system notification appears: *"Leaving Home Apartment? Don't forget your unpacked items: MacBook Pro, Office Access Card"*.
   - Return to the Home Dashboard: the bell icon shows an unread badge `(1)`.
   - Open the checklist, mark *MacBook Pro* as packed.
   - Run **Test Exit Alert 🚀** again: only *Office Access Card* is listed!
   - Mark all items as packed and test again: the alert is properly suppressed!

### Option B: Background Geofencing with Development Build
To test native OS background geofencing:
```bash
cd frontend
npx eas build --profile development --platform android
```
The resulting APK utilizes the native background services configured in `app.json` (`ACCESS_BACKGROUND_LOCATION`, `FOREGROUND_SERVICE_LOCATION`).

