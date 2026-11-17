# PackWise — Milestone 1 Documentation: Project Foundation, UI Design System, Authentication and Backend Setup

## 1. Milestone Overview

PackWise is an AI-powered context-aware packing and intelligent item management system featuring geofencing and real-time collaboration.

**Milestone 1** establishes the complete architecture and foundation of the PackWise platform across three main layers:
1. **Frontend Architecture & Navigation:** React Native mobile application powered by Expo and Expo Router, featuring a custom modern minimal UI design system (inspired by Uber/Ola minimal design guidelines with 85-90% white background and deep navy accents).
2. **Backend Architecture & APIs:** Express.js REST API with CORS, centralized error handling, health diagnostics, and Firebase Admin SDK authentication verification middleware.
3. **Database & Identity:** Firebase Authentication (Email/Password) and Cloud Firestore for user profile storage (`users/{uid}`) protected with initial Firestore Security Rules.

---

## 2. Implemented Architecture

```
PackWise/
|-- frontend/                       # React Native (Expo) Mobile Application
|   |-- app/                        # Expo Router file-based navigation
|   |   |-- _layout.js              # Root layout with AuthProvider & RouteGuard
|   |   |-- index.js                # Animated Splash screen & auth router
|   |   |-- (auth)/                 # Authentication Flow Group
|   |   |   |-- _layout.js          # Auth stack configuration
|   |   |   |-- onboarding.js       # Visual onboarding carousel & value proposition
|   |   |   |-- login.js            # Login with email/password & validation
|   |   |   |-- register.js         # User registration with Firestore profile creation
|   |   |-- (tabs)/                 # Main App Bottom Tabs Group
|   |       |-- _layout.js          # Bottom navigation bar (4 tabs)
|   |       |-- index.js            # Home Dashboard with packing progress & quick actions
|   |       |-- storage.js          # Storage Manager (bags & containers)
|   |       |-- groups.js           # Trip Groups & member progress sync
|   |       |-- profile.js          # User profile, app settings, and sign-out
|   |-- components/
|   |   |-- buttons/
|   |   |   |-- PrimaryButton.js    # Deep navy rounded button with loading state
|   |   |   |-- SecondaryButton.js  # Subtle / outlined secondary action button
|   |   |-- cards/
|   |   |   |-- PackingProgressCard.js # 72% progress card with suitcase graphic
|   |   |   |-- QuickActionCard.js  # 2x2 grid action card
|   |   |   |-- EventCard.js        # Upcoming trip card (e.g., Trip to Shimla)
|   |   |-- forms/
|   |   |   |-- CustomInput.js      # Clean input with icons and password toggle
|   |   |-- common/
|   |       |-- Header.js           # Screen header with back navigation
|   |-- constants/
|   |   |-- colors.js               # Strict color tokens (Navy, White, Beige, Gray)
|   |   |-- theme.js                # Spacing, typography, radii, and shadows
|   |-- context/
|   |   |-- AuthContext.js          # Global authentication state provider
|   |-- services/
|   |   |-- firebase.js             # Client Firebase App, Auth, and Firestore config
|   |   |-- authService.js          # Sign in, Sign up, Sign out, and friendly errors
|   |   |-- userService.js          # Firestore CRUD for users/{uid} documents
|   |   |-- api.js                  # Axios/Fetch client with Bearer token injection
|   |-- app.json                    # Expo configuration
|   |-- package.json                # Frontend dependencies
|   |-- .env.example                # Sample frontend environment file
|
|-- backend/                        # Node.js + Express REST API Backend
|   |-- config/
|   |   |-- firebaseAdmin.js        # Firebase Admin SDK initialization
|   |-- controllers/
|   |   |-- healthController.js     # Health check & protected verification handlers
|   |-- middleware/
|   |   |-- authMiddleware.js       # Firebase ID token verification middleware
|   |   |-- errorMiddleware.js      # Centralized error and 404 handlers
|   |-- routes/
|   |   |-- healthRoutes.js         # /api/health and /api/health/protected routes
|   |-- server.js                   # Express application entrypoint (0.0.0.0 binding)
|   |-- package.json                # Backend dependencies
|   |-- .env.example                # Sample backend environment file
|
|-- firestore.rules                 # Cloud Firestore security rules
|-- README.md                       # Comprehensive project setup guide
|-- .gitignore                      # Git exclusion rules for secrets and builds
```

---

## 3. UI Design System Implementation

The visual styling closely reflects the PackWise reference specifications:

| Design Token | Value | Purpose |
|---|---|---|
| `Colors.primary` | `#14243E` | Deep Navy Blue — Key buttons, active tabs, major headings |
| `Colors.background` | `#FFFFFF` | Pure White — Main surface background (85-90% light ratio) |
| `Colors.backgroundSecondary` | `#F5F6F8` | Very light neutral — Input fields, subtle icon badges |
| `Colors.border` | `#EAEDF1` | Ultra-light gray for clean separation |
| `Colors.textPrimary` | `#14243E` | Navy charcoal for strong typography readability |
| `Colors.textSecondary` | `#6B7280` | Muted neutral for subtitles and metadata |
| `Radii.lg` | `20px` | Rounded cards matching modern Android guidelines |
| `Radii.full` | `9999px` | Pill buttons and badge indicators |

---

## 4. Frontend Screens Created

### 1. Splash Screen (`app/index.js`)
- Displays PackWise suitcase icon with orbiting airplane.
- Bold navy typography: "PackWise" and tagline "Pack Smart. Travel Better."
- Smooth state evaluation: redirects authenticated users to `/(tabs)` and guest users to `/(auth)/onboarding`.

### 2. Onboarding Screen (`app/(auth)/onboarding.js`)
- 4-slide value proposition carousel:
  1. Smarter Packing for a Worry-Free Trip
  2. Weather-Aware Recommendations
  3. Smart Storage & Luggage Tracking
  4. Real-Time Group Collaboration
- 4-dot indicator with active navy indicator.
- "Get Started →" and "Sign In" buttons.

### 3. Login Screen (`app/(auth)/login.js`)
- Top PackWise suitcase brand mark.
- Segmented pill switcher: `[ Login (Active) | Sign Up ]`.
- Email input with email icon.
- Password input with secure text entry toggle.
- "Sign In" primary button with loading indicator.
- Social buttons placeholder (Google, Apple).
- Direct switch to registration.

### 4. Registration Screen (`app/(auth)/register.js`)
- Full Name, Email, Password, and Confirm Password fields.
- Input validation:
  - Required field check.
  - Email format regex validation.
  - Password minimum 6 characters.
  - Password and confirm password match check.
- Firebase Auth user creation and immediate Firestore profile record creation.

### 5. Home Dashboard (`app/(tabs)/index.js`)
- Top bar greeting: `Hello, {Name}! 👋` with notification bell and red unread dot.
- "Your Packing Progress" card (72% progress, progress bar, blue suitcase graphic).
- 2x2 Quick Actions grid:
  - **New Checklist** (`✨ Create`)
  - **My Bags** (`📦 Organize`)
  - **Groups** (`👥 Share`)
  - **Reminders** (`⏰ Set`)
- "Upcoming Events" card displaying "Trip to Shimla (Apr 27 - May 1 • 5 days)".
- **Live Backend Diagnostic Pill:** Displays real-time server connectivity status and version, with a tap-to-refresh button.

### 6. Storage Screen (`app/(tabs)/storage.js`)
- "Storage Manager" header with "Your Bags & Containers" subtitle.
- Search container input filter.
- Card list for containers: Blue Suitcase (12 items), Laptop Bag (4 items), First-Aid Kit (6 items), Storage Box (3 items).
- "Add Container +" primary button.

### 7. Groups Screen (`app/(tabs)/groups.js`)
- "Trip Group" header (4 Members • Shimla Expedition).
- Group checklist preview card.
- Members' real-time progress bars: You (72%), Riya (68%), Aditya (65%).
- "Share Checklist" primary button.

### 8. Profile Screen (`app/(tabs)/profile.js`)
- User avatar circle, full name, and authenticated email.
- Menu options: My Trips, Shared Groups, App Settings, Help & Support, About PackWise.
- Destructive "Log Out" button with confirmation alert that logs out from Firebase and returns to the login screen.

---

## 5. Backend Implementation

The backend is built with Node.js and Express.

### Endpoints
- `GET /` — Root service information and status.
- `GET /api/health` — Public health check returning:
  ```json
  {
    "success": true,
    "message": "PackWise backend is running",
    "timestamp": "2026-11-17T15:13:46.769Z",
    "service": "packwise-api",
    "version": "1.0.0",
    "firebaseAdminReady": false
  }
  ```
- `GET /api/health/protected` — Protected verification route that extracts and validates the client's Firebase ID Token using Firebase Admin SDK.

### Middleware & Security
- **CORS:** Configured for cross-origin requests from web, emulators, and local physical devices.
- **Error Handling:** Centralized 404 handler and unified error response middleware.
- **Network Listener:** Listens on `0.0.0.0:5001` so physical Android phones on the same Wi-Fi network can connect directly.

---

## 6. Firebase & Firestore Integration

### Client Authentication & Store (`frontend/services/`)
- `firebase.js`: Initializes client Firebase App, Auth (with AsyncStorage persistence), and Firestore.
- `authService.js`: Wraps `createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `signOut`, `updateProfile`, and returns user-friendly error messages.
- `userService.js`: Handles Firestore user profile operations in `users/{uid}`.

### Firestore Security Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 7. Testing Completed

- [x] Backend starts and binds to `0.0.0.0:5001`.
- [x] `GET /api/health` returns `200 OK` with JSON payload.
- [x] `GET /api/nonexistent` correctly triggers centralized 404 handler.
- [x] Frontend Expo configuration parsed and verified with `npx expo config --type public`.
- [x] Clean separation of dependencies between `frontend/package.json` and `backend/package.json`.
- [x] Security rules and `.gitignore` protect sensitive credentials and environment files.

---

## 8. Remaining Tasks for Later Milestones
- **Milestone 2:** Gemini AI Checklist Generation and OpenWeatherMap integration.
- **Milestone 3:** Bag and storage container item cataloging with QR/barcode tagging.
- **Milestone 4:** Packing and unpacking state tracking and trip itineraries.
- **Milestone 5:** Geofencing, leave-behind background notifications, and calendar reminders.
- **Milestone 6:** Real-time multi-user collaboration and shared checklist sync.

