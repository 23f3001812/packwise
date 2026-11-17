# PackWise — AI-Powered Context-Aware Packing System

PackWise is an intelligent mobile application designed to streamline packing, unpacking, belongings organization, travel schedules, and collaborative group trips.

Built with **React Native (Expo)**, **Node.js + Express**, and **Firebase (Authentication & Cloud Firestore)**.

---

## 📱 Visual Design System

Inspired by clean, minimalist design principles (Uber/Ola aesthetics):
- **Base Background:** White (`#FFFFFF`, 85–90% light surface ratio)
- **Primary Brand Color:** Deep Navy Blue (`#14243E`)
- **Secondary Surfaces:** Neutral Light Gray (`#F5F6F8`)
- **Text:** Navy Charcoal (`#14243E`) and Muted Gray (`#6B7280`)
- **Accent:** Warm beige and subtle sand highlights
- **Typography & Components:** Rounded cards (`borderRadius: 20`), pill buttons (`borderRadius: 9999`), clear visual hierarchy.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Mobile Frontend** | React Native (Expo SDK 58), JavaScript, Expo Router, React Native Paper |
| **Backend REST API** | Node.js (v22), Express.js, CORS, Dotenv |
| **Authentication** | Firebase Authentication (Email/Password) |
| **Database** | Firebase Cloud Firestore (`users/{uid}`) |
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
|   |       |-- _layout.js           # 4-Tab Bottom Navigation Bar
|   |       |-- index.js             # Home Dashboard with Progress & Actions
|   |       |-- storage.js           # Storage Manager (Bags & Containers)
|   |       |-- groups.js            # Trip Groups & Collaboration
|   |       |-- profile.js           # Profile, Settings & Sign Out
|   |-- components/
|   |   |-- buttons/                 # PrimaryButton, SecondaryButton
|   |   |-- cards/                   # PackingProgressCard, QuickActionCard, EventCard
|   |   |-- forms/                   # CustomInput
|   |   |-- common/                  # Header
|   |-- constants/
|   |   |-- colors.js                # Color palette tokens
|   |   |-- theme.js                 # Spacing, typography, radii, shadows
|   |-- context/
|   |   |-- AuthContext.js           # Global auth state & session restore
|   |-- services/
|   |   |-- firebase.js              # Client Firebase App, Auth & Firestore
|   |   |-- authService.js           # Authentication business logic
|   |   |-- userService.js           # Firestore user profile CRUD
|   |   |-- api.js                   # HTTP client with Firebase ID token injection
|   |-- app.json
|   |-- package.json
|   |-- .env.example
|
|-- backend/
|   |-- config/
|   |   |-- firebaseAdmin.js         # Firebase Admin SDK initialization
|   |-- controllers/
|   |   |-- healthController.js      # /api/health controllers
|   |-- middleware/
|   |   |-- authMiddleware.js        # Firebase ID token verification
|   |   |-- errorMiddleware.js       # Centralized 404 & error handlers
|   |-- routes/
|   |   |-- healthRoutes.js          # Health check routes
|   |-- server.js                    # Express app listening on 0.0.0.0:5001
|   |-- package.json
|   |-- .env.example
|
|-- documentation/
|   |-- MILESTONE_1.md               # Detailed Milestone 1 report
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

4. Start the backend development server:
   ```bash
   npm run dev
   # or
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
     "message": "PackWise backend is running"
   }
   ```

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
   *(Fill in your Firebase credentials in `frontend/.env` as explained in the Firebase Setup section below).*

4. Start the Expo development server:
   ```bash
   npx expo start
   ```

---

## 🔥 Firebase Setup Instructions

Follow these steps to connect your own Firebase project:

### Step A: Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or **Create a project**).
3. Name your project (e.g. `packwise-app`).
4. (Optional) Disable or enable Google Analytics, then click **Create project**.

### Step B: Enable Email/Password Authentication
1. In the Firebase Console left sidebar, click **Build** > **Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, click **Email/Password**.
4. Enable the first toggle: **Email/Password**. Leave Email link disabled.
5. Click **Save**.

### Step C: Create Cloud Firestore
1. In the left sidebar, click **Build** > **Firestore Database**.
2. Click **Create database**.
3. Choose a database location close to you (e.g. `asia-south1` or `us-central1`).
4. Select **Start in test mode** (or production mode; you will paste the security rules next).
5. Click **Create**.
6. Go to the **Rules** tab in Firestore Database, copy the contents of `firestore.rules` from this repository, and click **Publish**:
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

### Step D: Register Web App & Get Frontend Credentials
1. In Firebase Console, click the **Gear icon (⚙️)** next to Project Overview > **Project settings**.
2. Scroll down to the **Your apps** section and click the **Web icon (`</>`)**.
3. Enter an app nickname (e.g., `PackWise Web/Mobile`) and click **Register app**.
4. You will see a `firebaseConfig` object with:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`
5. Open `frontend/.env` and paste these exact values:
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=packwise-app.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=packwise-app
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=packwise-app.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
   EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
   ```

### Step E: Configure Backend Firebase Admin Credentials
1. In Firebase Console, go to **Project settings** > **Service accounts** tab.
2. Under "Firebase Admin SDK", select **Node.js** and click **Generate new private key**.
3. Confirm by clicking **Generate key**. A `.json` file will download to your computer.
4. Rename this file to `serviceAccountKey.json` and move it to:
   ```
   backend/config/serviceAccountKey.json
   ```
   *(Note: This path is already in `.gitignore` and will never be tracked by git).*
5. In `backend/.env`, ensure:
   ```env
   FIREBASE_SERVICE_ACCOUNT_PATH=./config/serviceAccountKey.json
   ```
6. Restart the backend server. The console will display:
   ```
   [Firebase Admin] Initialized with credentials from: .../backend/config/serviceAccountKey.json
   ```

---

## 📲 Testing on Android (Expo Go)

1. Connect your Android phone to the same Wi-Fi network as your computer.
2. Find your computer's local network IP:
   - On Windows PowerShell: `ipconfig` (look for IPv4 Address, e.g. `192.168.1.15`).
3. In `frontend/.env`, set:
   ```env
   EXPO_PUBLIC_BACKEND_URL=http://<YOUR_COMPUTER_IP>:5001/api
   ```
   *(e.g., `http://192.168.1.15:5001/api`).*
   > **Important:** On physical devices, `localhost` points to the mobile device itself, not your PC! Using your computer's local IP enables the phone to communicate with your Express backend.
4. Run `npx expo start` in the `frontend` folder.
5. Open the **Expo Go** app on your Android device and scan the terminal QR code.
6. The PackWise app will load. The Home dashboard will display a green indicator:
   `🟢 Backend Online (v1.0.0)` confirming connectivity!

---

## 🔒 Known Limitations for Milestone 1

As planned in the 6-milestone roadmap, the following features are intentionally scoped for later milestones:
- AI-powered checklist generation via Google Gemini (Milestone 2)
- Weather data recommendations via OpenWeatherMap (Milestone 2)
- RFID/NFC & QR container item scanning (Milestone 3)
- Trip itineraries and packing/unpacking checkbox states (Milestone 4)
- Geofencing and background leave-behind push notifications (Milestone 5)
- Real-time collaborative checklists with Firestore listeners (Milestone 6)

All UI buttons and cards for these features display informative dialogs explaining their upcoming milestone without crashing.

