# PackWise — AI-Powered Context-Aware Packing System

PackWise is an intelligent mobile application designed to streamline packing, unpacking, belongings organization, travel schedules, and collaborative group trips.

Built with **React Native (Expo)**, **Node.js + Express**, **Google Gemini AI**, **OpenWeatherMap**, and **Firebase (Authentication & Cloud Firestore)**.

---

## 📱 Visual Design System

Inspired by clean, minimalist design principles (Uber/Ola aesthetics):
- **Base Background:** White (`#FFFFFF`, 85–90% light surface ratio)
- **Primary Brand Color:** Deep Navy Blue (`#14243E`)
- **Secondary Surfaces:** Neutral Light Gray (`#F5F6F8`)
- **Text:** Navy Charcoal (`#14243E`) and Muted Gray (`#6B7280`)
- **Accent:** Warm beige, subtle amber highlights, and verified green/blue pills
- **Typography & Components:** Rounded cards (`borderRadius: 20`), pill buttons (`borderRadius: 9999`), clear visual hierarchy.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Mobile Frontend** | React Native (Expo SDK 58), JavaScript, Expo Router, React Native Paper |
| **Backend REST API** | Node.js (v22), Express.js, CORS, Dotenv (Running on Port 5001) |
| **Generative AI** | Google Gemini (`@google/genai` official SDK, Flash model with structured JSON) |
| **Weather Engine** | OpenWeatherMap (Geocoding API & 5-Day / 3-Hour Forecast API) |
| **Authentication** | Firebase Authentication (Email/Password) |
| **Database** | Firebase Cloud Firestore (`users/{uid}`, `packingLists/{id}`, `items/{id}`, `containers/{id}`) |
| **Admin Operations** | Firebase Admin SDK (token verification middleware) |
| **Development** | npm, Git |

---

## 📂 Project Structure

```
PackWise/
|
|-- frontend/
|   |-- app/
|   |   |-- _layout.js               # Root stack, AuthProvider & RouteGuard
|   |   |-- index.js                 # Splash screen with auto-routing
|   |   |-- (auth)/
|   |   |   |-- _layout.js           # Auth stack navigator
|   |   |   |-- onboarding.js        # Onboarding value proposition carousel
|   |   |   |-- login.js             # Sign in with email/password
|   |   |   |-- register.js          # Sign up with Firestore profile sync
|   |   |-- (tabs)/
|   |   |   |-- _layout.js           # 4-Tab Bottom Navigation Bar
|   |   |   |-- index.js             # Home Dashboard with Live Firestore Metrics, Bell Badge & AI Shortcut
|   |   |   |-- storage.js           # Storage Manager (Bags & Containers CRUD)
|   |   |   |-- groups.js            # Trip Collaboration Hub (Shared Trips & Invitations)
|   |   |   |-- profile.js           # Profile, Settings, Locations, Reminders & Sign Out
|   |   |-- lists/
|   |   |   |-- index.js             # Packing Lists Overview (Search, Filter, Sort, Shared Filter)
|   |   |   |-- create.js            # Create/Edit Packing List Form (with AI Assistant Banner)
|   |   |   |-- [id].js              # Real-Time Checklist (Collaborators, Viewer Mode & Trip Reminders)
|   |   |-- collaboration/
|   |   |   |-- members/
|   |   |       |-- [listId].js      # Collaborators Screen (Roster, Invite Modal, Role Switcher)
|   |   |-- locations/
|   |   |   |-- index.js             # Saved Geofence Locations Roster (Active Toggle, Edit/Delete)
|   |   |   |-- create.js            # Add/Edit Location (Current GPS Capture, Geocoding, Radius Chips)
|   |   |-- reminders/
|   |   |   |-- index.js             # Leave-Behind Reminders List & Test Exit Alert Simulator
|   |   |   |-- create.js            # Create/Edit Leave-Behind Reminder (Location, Items, onlyUnpacked)
|   |   |-- notifications/
|   |   |   |-- index.js             # In-App Notification Center (Filter chips, Read indicators, Clear all)
|   |   |-- settings/
|   |   |   |-- notifications.js     # Permission Diagnostics, Device Settings Deep Link & Preferences
|   |   |-- ai/
|   |       |-- index.js             # AI Packing Assistant: Trip & Activities Input Form
|   |       |-- review.js            # Recommendation Review, Weather Summary & Batch Saver
|   |-- components/
|   |   |-- buttons/                 # PrimaryButton, SecondaryButton
|   |   |-- cards/                   # PackingProgressCard, QuickActionCard, EventCard
|   |   |-- forms/                   # CustomInput
|   |   |-- common/                  # Header, AppIcon (Resilient Vector Icon with Fallback Maps)
|   |   |-- packing/                 # PackingListCard, PackingItemCard, PackingModeToggle,
|   |   |                            # AddItemModal, CategorySection
|   |   |-- storage/                 # ContainerCard, ContainerModal, ContainerItemListModal
|   |   |-- collaboration/           # CollaboratorAvatarGroup, CollaboratorCard, InvitationCard,
|   |   |                            # InviteMemberModal
|   |   |-- ai/                      # TripDetailsForm, WeatherSummaryCard, RecommendationCard,
|   |   |                            # AIProcessingIndicator
|   |-- constants/
|   |   |-- colors.js                # Color palette tokens
|   |   |-- theme.js                 # Spacing, typography, radii, shadows
|   |   |-- categories.js            # 10 item categories, priorities, event types, activities
|   |-- context/
|   |   |-- AuthContext.js           # Global auth state & session restore
|   |-- hooks/
|   |   |-- useCollaborativeList.js  # Real-time Firestore onSnapshot hook for list, items, members
|   |   |-- usePendingInvitations.js # Real-time listener for incoming pending invitations
|   |   |-- useUnreadNotifications.js# Real-time listener for unread in-app notification count
|   |-- services/
|   |   |-- firebase.js              # Client Firebase App, Auth & Firestore
|   |   |-- authService.js           # Authentication business logic
|   |   |-- userService.js           # Firestore user profile CRUD
|   |   |-- packingService.js        # Packing list CRUD & dashboard summary API
|   |   |-- itemService.js           # Item CRUD & toggle API
|   |   |-- containerService.js      # Storage container CRUD & items API
|   |   |-- collaborationService.js  # Collaboration & invitations client API
|   |   |-- locationService.js       # Saved geofenced locations client API
|   |   |-- reminderService.js       # Leave-behind reminders & geofence exit client API
|   |   |-- notificationHistoryService.js # In-app notification center & preferences client API
|   |   |-- notificationService.js   # Local trip departure reminder scheduling & permission checks
|   |   |-- geofenceService.js       # Background task registration, geofence sync & simulation
|   |   |-- aiService.js             # AI checklist generation & batch add items API
|   |   |-- weatherService.js        # Destination forecast API client
|   |   |-- api.js                   # HTTP client with Firebase ID token injection
|   |-- app.json
|   |-- package.json
|   |-- .env.example
|
|-- backend/
|   |-- config/
|   |   |-- firebaseAdmin.js         # Firebase Admin SDK initialization & Firestore db
|   |-- controllers/
|   |   |-- healthController.js      # /api/health controllers
|   |   |-- listController.js        # /api/lists controllers
|   |   |-- itemController.js        # /api/items & batch addition controllers
|   |   |-- containerController.js   # /api/containers controllers
|   |   |-- collaborationController.js # /api/collaboration controllers
|   |   |-- locationController.js    # /api/locations controllers
|   |   |-- reminderController.js    # /api/reminders controllers & exit evaluation
|   |   |-- notificationController.js# /api/notifications & preferences controllers
|   |   |-- aiController.js          # /api/ai recommendations controllers
|   |   |-- weatherController.js     # /api/weather forecast controllers
|   |-- middleware/
|   |   |-- authMiddleware.js        # Firebase ID token verification
|   |   |-- errorMiddleware.js       # Centralized 404 & error handlers
|   |-- routes/
|   |   |-- healthRoutes.js          # Health check routes
|   |   |-- listRoutes.js            # Packing list & batch item routes
|   |   |-- itemRoutes.js            # Item routes
|   |   |-- containerRoutes.js       # Storage container routes
|   |   |-- collaborationRoutes.js   # Collaboration & invitations routes
|   |   |-- locationRoutes.js        # Saved locations routes
|   |   |-- reminderRoutes.js        # Leave-behind reminder routes
|   |   |-- notificationRoutes.js    # Notifications & preferences routes
|   |   |-- aiRoutes.js              # Gemini recommendation routes
|   |   |-- weatherRoutes.js         # OpenWeatherMap forecast routes
|   |-- services/
|   |   |-- listService.js           # List CRUD, metrics & cascading cleanup
|   |   |-- itemService.js           # Item CRUD, toggle & container verification
|   |   |-- containerService.js      # Container CRUD & item unassignment cascade
|   |   |-- collaborationService.js  # Real-time collaboration, invitations & RBAC logic
|   |   |-- locationService.js       # Geofenced locations CRUD, radius validation & cascade
|   |   |-- reminderService.js       # Smart leave-behind engine & geofence exit evaluation
|   |   |-- notificationHistoryService.js # In-app notification center & preferences logic
|   |   |-- geminiService.js         # Google Gemini AI (@google/genai SDK) integration
|   |   |-- weatherService.js        # OpenWeatherMap geocoding, 5-day forecast & caching
|   |   |-- recommendationService.js # AI prompt construction, weather merge & deduplication
|   |-- tests/
|   |   |-- test_milestone3.js       # Milestone 3 automated test suite (25 test cases)
|   |   |-- test_milestone4.js       # Milestone 4 automated test suite (48 test cases)
|   |   |-- test_milestone5.js       # Milestone 5 automated test suite (55 test cases)
|   |   |-- test_milestone6.js       # Milestone 6 master integration test suite (50 test cases)
|   |-- server.js                    # Express app listening on 0.0.0.0:5001
|   |-- package.json
|   |-- .env.example
|
|-- documentation/
|   |-- MILESTONE_1.md               # Detailed Milestone 1 report
|   |-- MILESTONE_2.md               # Detailed Milestone 2 report
|   |-- MILESTONE_3.md               # Detailed Milestone 3 report
|   |-- MILESTONE_4.md               # Detailed Milestone 4 report
|   |-- MILESTONE_5.md               # Detailed Milestone 5 report
|   |-- MILESTONE_6.md               # Detailed Milestone 6 final integration report
|-- firestore.rules                  # Firestore security rules
|-- README.md                        # Master project documentation
|-- .gitignore                       # Git ignore file
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js:** v18 or later (tested on v22)
- **npm:** v9 or later
- **Expo Go App:** Installed on your physical Android/iOS phone (from Google Play Store or Apple App Store)

---

### 2. Backend Setup & Run

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create the environment file:
   ```bash
   cp .env.example .env
   ```
   *(Ensure `PORT=5001`, `FIREBASE_SERVICE_ACCOUNT_PATH=./config/serviceAccountKey.json`, `GEMINI_API_KEY`, and `OPENWEATHER_API_KEY` are configured).*

4. Start the backend development server:
   ```bash
   npm start
   ```

5. Verify that the backend is running:
   ```bash
   curl http://localhost:5001/api/health
   ```
   Expected response:
   ```json
   {
     "success": true,
     "message": "PackWise backend is running",
     "port": 5001,
     "firebaseAdminReady": true
   }
   ```

6. Run the Milestone 3 automated verification suite:
   ```bash
   node tests/test_milestone3.js
   ```
   Expected result: **25 PASSED | 0 FAILED**.

7. Run the Milestone 4 automated collaboration verification suite:
   ```bash
   node tests/test_milestone4.js
   ```
   Expected result: **48 PASSED | 0 FAILED**.

8. Run the Milestone 5 automated geofencing & notification verification suite:
   ```bash
   node tests/test_milestone5.js
   ```
   Expected result: **55 PASSED | 0 FAILED**.

9. Run the Milestone 6 master integration test suite:
   ```bash
   node tests/test_milestone6.js
   ```
   Expected result: **50 PASSED | 0 FAILED**. Total automated verification: **178 PASSED | 0 FAILED**.

---

### 3. Frontend Setup & Run

1. Open a second terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your local environment file:
   ```bash
   cp .env.example .env
   ```
   *(Fill in your Firebase credentials in `frontend/.env`).*

4. Start the Expo development server:
   ```bash
   npx expo start -c
   ```

---

## 📡 REST API Reference

All protected endpoints require `Authorization: Bearer <FIREBASE_ID_TOKEN>`.

### Health Check
- `GET /api/health` — Public health check & Firebase Admin readiness status

### AI Recommendations (`/api/ai`)
- `POST /api/ai/generate-weather-aware-checklist` — Primary endpoint: Evaluates destination weather forecast and generates structured Gemini AI packing recommendations (`destination`, `eventType`, `startDate`, `endDate`, `activities`, `travellers`, `preferences`, `existingItems`).
- `POST /api/ai/generate-checklist` — Standard AI packing generation without live weather forecast.

### Weather (`/api/weather`)
- `POST /api/weather/forecast` — Returns normalized travel-date aware forecast from OpenWeatherMap (`destination`, `startDate`, `endDate`). Never fabricates weather for dates beyond the 5-day window.
- `GET /api/weather/forecast?destination=...&startDate=...&endDate=...` — Query parameter alternative.

### Packing Lists & Items (`/api/lists`, `/api/items`)
- `POST /api/lists` — Create a new packing list
- `GET /api/lists` — Get all packing lists for user (supports `?status=all|active|completed|archived&sort=date|created`)
- `GET /api/lists/summary/dashboard` — Aggregate metrics for home dashboard
- `GET /api/lists/:id` — Get single packing list with items & dynamic progress
- `PUT /api/lists/:id` — Update packing list details
- `DELETE /api/lists/:id` — Delete packing list with batched cascading deletion of all associated items
- `POST /api/lists/:listId/items/batch` — Atomically batch-insert multiple AI recommendations into a packing list in Firestore
- `POST /api/lists/:listId/items` — Add single packing item
- `PATCH /api/items/:id/status` — Update item packed or unpacked status
- `DELETE /api/items/:id` — Delete single item

### Containers (`/api/containers`)
- `POST /api/containers` — Create container (`name`, `type`, `color`, `notes`)
- `GET /api/containers` — Get all user containers with active assigned item counts
- `GET /api/containers/:id/items` — Get all items assigned to container across trips
- `DELETE /api/containers/:id` — Delete container with safe unassignment cascade (`containerId: null` on items)

### Locations (`/api/locations`)
- `POST /api/locations` — Create saved geofence location (`name`, `latitude`, `longitude`, `radius`, `type`, `address`)
- `GET /api/locations` — Get all user saved locations
- `GET /api/locations/:id` — Get single location details
- `PUT /api/locations/:id` — Update location coordinates, name, or radius
- `PATCH /api/locations/:id/toggle` — Toggle location active/inactive
- `DELETE /api/locations/:id` — Delete location with cascading reminder deactivation

### Reminders & Leave-Behind (`/api/reminders`)
- `POST /api/reminders` — Create leave-behind reminder linked to location and checklist items
- `GET /api/reminders` — Get all user reminders (supports `?locationId=...`)
- `POST /api/reminders/evaluate-exit` — Evaluate geofence exit: checks unpacked items, suppresses if 100% packed, records in-app notification
- `GET /api/reminders/:id` — Get single reminder details
- `PUT /api/reminders/:id` — Update reminder settings or items
- `PATCH /api/reminders/:id/toggle` — Toggle reminder active/inactive
- `DELETE /api/reminders/:id` — Delete reminder

### Notifications & Preferences (`/api/notifications`)
- `GET /api/notifications` — Get in-app notification history (supports `?limit=...&type=...`)
- `POST /api/notifications` — Create an in-app notification
- `PATCH /api/notifications/:id/read` — Mark single notification as read
- `PATCH /api/notifications/mark-all-read` — Mark all user notifications as read
- `DELETE /api/notifications/clear-all` — Clear all notifications
- `GET /api/notifications/preferences` — Get notification preferences (leave-behind, trip, sound)
- `PUT /api/notifications/preferences` — Update notification preferences

---

## 🔥 Firebase & Provider API Setup Instructions

### Step A: Configure Backend Firebase Admin Credentials
1. In Firebase Console, go to **Project settings** > **Service accounts** tab.
2. Select **Node.js** and click **Generate new private key**.
3. Rename the downloaded `.json` file to `serviceAccountKey.json` and move it to:
   ```
   backend/config/serviceAccountKey.json
   ```

### Step B: Configure Google Gemini API
1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Click **Get API key** and create a key.
3. In `backend/.env`, set:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key
   GEMINI_MODEL=gemini-2.5-flash
   ```

### Step C: Configure OpenWeatherMap API
1. Sign up at [OpenWeatherMap](https://openweathermap.org/api) for a free account.
2. Under profile, select **My API Keys** and copy your key.
3. In `backend/.env`, set:
   ```env
   OPENWEATHER_API_KEY=your_actual_openweather_api_key
   ```

*(Note: Provider keys are kept strictly server-side in `backend/.env` and are never exposed to the frontend).*

---

## 📲 Testing on Android (Expo Go)

1. Connect your Android phone to the same Wi-Fi network as your computer.
2. Find your computer's local network IP via `ipconfig` (e.g. `192.168.1.8`).
3. In `frontend/.env`, set:
   ```env
   EXPO_PUBLIC_BACKEND_URL=http://<YOUR_COMPUTER_IP>:5001/api
   ```
4. Start the frontend:
   ```bash
   npx expo start -c
   ```
5. Scan the QR code in **Expo Go** on Android.
6. Test Leave-Behind Reminders: Go to **Profile** > **Leave-Behind Reminders** and tap **Test Exit Alert** to immediately evaluate unpacked items and see system notifications in action!

---

## 🗺️ Project Milestones Roadmap

- [x] **Milestone 1:** Project Foundation, UI Design System, Authentication, and Backend Setup
- [x] **Milestone 2:** Core Packing & Intelligent Storage Management (Lists, Items, Unpacking Mode, Bags/Containers, Live Dashboard)
- [x] **Milestone 3:** AI-Powered Packing Checklist Generation (Google Gemini) & Weather Recommendations (OpenWeatherMap)
- [x] **Milestone 4:** Real-Time Collaborative Packing System & Shared Lists (RBAC: Owner, Editor, Viewer, Invitation Lifecycle, onSnapshot Real-Time Sync, Authorship Attribution)
- [x] **Milestone 5:** Geofencing, Smart Leave-Behind Alerts & Notifications (Saved Locations, Context-Aware Exit Evaluation, Trip Reminders, Notification Center, Expo TaskManager)
- [x] **Milestone 6:** Final Integration, UI Polish, Bug Fixing, Testing & Release Readiness (All 6 Milestones Complete!)
