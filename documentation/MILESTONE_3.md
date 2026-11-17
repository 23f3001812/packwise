# PackWise — Milestone 3 Technical Report
## AI-Powered Packing Checklist Generation & Weather-Aware Recommendations

**Project Title:** PackWise: An AI-Powered Context-Aware Packing and Intelligent Item Management System with Geofencing and Real-Time Collaboration  
**Milestone:** 3 of 6  
**Status:** Completed & Verified  

---

## 1. Overview & Objectives

Milestone 3 equips PackWise with intelligent, context-aware packing recommendations by combining two live integrations on the Express backend:
1. **Google Gemini Generative AI:** Generates tailored packing checklists using the official `@google/genai` SDK with strict JSON schema enforcement, multi-attribute prompts (duration, destination, travel type, activities, luggage preferences, and existing items deduplication).
2. **OpenWeatherMap Forecast Engine:** Resolves destination coordinates via Geocoding and evaluates real 5-day / 3-hour forecast distributions against the user's travel dates. Never fabricates weather conditions or temperatures when dates extend beyond the provider window.
3. **Interactive Recommendation Review Interface:** Allows travelers to review AI recommendations, inspect live weather metrics, adjust quantities, toggle individual items, remove unneeded items, and batch-save approved selections to new or existing packing lists in Cloud Firestore.

---

## 2. System Architecture

```
                           +----------------------------------------+
                           |         React Native / Expo App        |
                           |  - Dashboard AI Banner (/tabs/index)   |
                           |  - Trip Details Form (/ai/index)       |
                           |  - Weather & Review (/ai/review)       |
                           |  - Checklist Details (/lists/[id])     |
                           +-------------------+--------------------+
                                               |
                                     (Bearer ID Token)
                                               |
                                               v
+------------------------------------------------------------------------------------------+
|                               Express Backend (Port 5001)                                 |
|                                                                                          |
|   +--------------------+     +------------------------+     +------------------------+   |
|   | /api/ai            |     | /api/weather           |     | /api/lists/:id/items   |   |
|   |  - weather-aware   |     |  - forecast            |     |  - batch add           |   |
|   +---------+----------+     +-----------+------------+     +-----------+------------+   |
|             |                            |                              |                |
|             v                            v                              v                |
|   +--------------------+     +------------------------+     +------------------------+   |
|   | recommendationSvc  | <-> | weatherService         |     | itemService (Batch)    |   |
|   +---------+----------+     +-----------+------------+     +-----------+------------+   |
|             |                            |                              |                |
+-------------|----------------------------|------------------------------|----------------+
              |                            |                              |
              v                            v                              v
      +---------------+           +-----------------+            +-----------------+
      | Google Gemini |           | OpenWeatherMap  |            | Cloud Firestore |
      | Flash Model   |           | 5-Day Forecast  |            | (NoSQL DB)      |
      +---------------+           +-----------------+            +-----------------+
```

---

## 3. Google Gemini AI Integration

- **SDK:** Official `@google/genai` (Node.js SDK v3.4.0).
- **Model:** Dynamically configured via `GEMINI_MODEL=gemini-2.5-flash` in `backend/.env` (defaulting to `gemini-2.5-flash` or `gemini-1.5-flash`). Hardcoded model references are strictly prohibited.
- **Structured Schema Output:** Built with `@google/genai` schema types (`Type.OBJECT`, `Type.ARRAY`, `Type.STRING`, `Type.INTEGER`, `Type.BOOLEAN`) guaranteeing valid JSON parsing:
  - `tripSummary`: String
  - `destination`: String
  - `durationDays`: Integer
  - `weatherContext`: Object (`available`, `summary`)
  - `recommendations`: Array of objects (`name`, `category`, `quantity`, `priority`, `reason`, `weatherRelated`, `essential`)
  - `generalTips`: Array of strings
- **Deduplication against Existing Items:** When invoked from an existing checklist (`/lists/[id]`), the prompt explicitly incorporates existing item names to prevent redundant recommendations.
- **Security & Secrets:** The API key (`GEMINI_API_KEY`) is stored strictly in `backend/.env` and never exposed to the frontend or client bundles. If missing, the backend returns HTTP 503 (`GEMINI_NOT_CONFIGURED`) with a clean explanation rather than crashing.

---

## 4. OpenWeatherMap Integration & Travel-Date Awareness

- **Destination Geocoding:** Calls OpenWeatherMap Direct Geocoding API (`http://api.openweathermap.org/geo/1.0/direct?q=...`) to resolve cities or landmarks to precise latitude and longitude coordinates.
- **5-Day / 3-Hour Forecast:** Fetches metric forecasts (`https://api.openweathermap.org/data/2.5/forecast?lat=...&lon=...&units=metric`) and aggregates 3-hour slots into daily summaries (`minTemperature`, `maxTemperature`, `dominantCondition`, `rainProbability`, `humidity`, `windSpeed`).
- **Date Coverage Enforcement (Section C3):**
  - **Trips within 5 days:** Aggregates and returns verified daily forecasts and narrative summaries.
  - **Trips $> 5$ days in the future:** Returns `available: false` with the explicit reason: *"Trip dates are outside the 5-day weather forecast window. Reliable live forecasts are available up to 5 days in advance."*
  - **Trips in the past:** Returns `available: false` indicating dates have elapsed.
  - **Zero Fabrication:** The system never fabricates temperatures, conditions, or rainfall percentages when live data is unavailable.
- **In-Memory Caching:** Normalization responses are cached by destination and date range for 30 minutes to reduce provider quota consumption.

---

## 5. Combined Weather-Aware Recommendation Workflow

1. The client sends `{ destination, eventType, startDate, endDate, travellers, activities, preferences, notes, existingItems }` to `POST /api/ai/generate-weather-aware-checklist`.
2. `recommendationService` invokes `weatherService.getForecast(destination, startDate, endDate)`.
3. If weather is available, the forecast summary, temperature spread, and rain chances are fed directly into the Gemini prompt so the model recommends weather-appropriate items (e.g., waterproof jackets, umbrellas, sunscreen, thermal layers) with `weatherRelated: true`.
4. If weather is unavailable (future dates or missing key), Gemini is informed to generate recommendations based on general seasonal/geographical expectations while setting `weatherRelated: false`.
5. The response is validated, normalized into the 10 PackWise categories (`Clothing`, `Footwear`, `Toiletries`, `Electronics`, `Documents`, `Medicines`, `Accessories`, `Travel essentials`, `Food`, `Other`), deduplicated, and returned.

---

## 6. Batch Saving to Firestore

- **Endpoint:** `POST /api/lists/:listId/items/batch`
- **Ownership Verification:** Confirms that the target packing list exists and belongs to the authenticated user (`listDoc.data().userId == request.user.uid`).
- **Batch Transaction:** Uses Firestore `db.batch()` to write all selected items atomically (bounded at 50 items per batch).
- **Schema Conformity:** Every item is stored with:
  - `isPacked: false`
  - `isUnpacked: false`
  - `containerId: null`
  - Standardized `category`, `quantity`, `priority`, and `notes`.
- **Dynamic List Update:** Automatically refreshes `updatedAt` on the list, causing the checklist screen and dashboard to recalculate real packing progress on next load.

---

## 7. Backend API Specification

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/ai/generate-weather-aware-checklist` | Required | Combines destination weather forecast with Gemini AI recommendations |
| `POST` | `/api/ai/generate-checklist` | Required | Generates AI packing suggestions without live weather sync |
| `POST` | `/api/weather/forecast` | Required | Fetches date-aware normalized weather forecast for a destination |
| `GET` | `/api/weather/forecast` | Required | Query parameter variant for weather forecast |
| `POST` | `/api/lists/:listId/items/batch` | Required | Batch inserts selected recommendations into a packing list in Firestore |

---

## 8. Frontend Component & Screen Architecture

| Path | Type | Description |
|---|---|---|
| `frontend/app/ai/index.js` | Screen | AI Packing Assistant trip input form with activities and date pickers |
| `frontend/app/ai/review.js` | Screen | Recommendation review screen with selection controls, quantity adjustments, and list saver |
| `frontend/components/ai/TripDetailsForm.js` | Component | Polished form with activity chips, event type selector, and traveller stepper |
| `frontend/components/ai/WeatherSummaryCard.js` | Component | Displays live temperature range, rain chance, sky condition, or honest unavailable status |
| `frontend/components/ai/RecommendationCard.js` | Component | Recommendation card with checkbox, category pill, priority tag, weather badge, stepper, and delete |
| `frontend/components/ai/AIProcessingIndicator.js` | Component | Multi-stage loading screen illustrating destination analysis, weather checks, and Gemini generation |
| `frontend/services/aiService.js` | Service | Client service for AI checklist generation and batch saving |
| `frontend/services/weatherService.js` | Service | Client service for weather forecast retrieval |
| `frontend/constants/categories.js` | Constant | Centralized categories, priorities, event types, and activities |

---

## 9. Test Suite & Verification Results

### Automated Backend Test Suite (`backend/tests/test_milestone3.js`):
- **1. Input Validation:**
  - Empty destination: ✅ Properly rejected with error.
  - Inverted date range (End $<$ Start): ✅ Properly rejected with error.
  - Negative/zero travellers: ✅ Properly rejected with error.
- **2. Duration Calculation:**
  - Inclusive date range calculation: ✅ Correct (e.g. 2026-12-15 to 2026-12-20 = 6 days).
  - Null fallback: ✅ Defaults to 4 days.
- **3. Normalization & Deduplication:**
  - Case-insensitive duplicate name: ✅ Deduplicated and quantities merged (3 + 2 = 5).
  - Category normalization: ✅ Mapped "Apparel" $\rightarrow$ "Clothing", "Skincare" $\rightarrow$ "Toiletries".
  - Priority casing: ✅ Mapped "HIGH" $\rightarrow$ "High".
- **4. Weather Service Graceful Fallback:**
  - Missing API key: ✅ Returns `{ available: false }` with configuration reason without throwing or crashing.
- **5. Weather Date Coverage:**
  - Future dates $> 5$ days: ✅ Correctly flagged as outside coverage window.
- **6. Gemini AI Service Graceful Fallback:**
  - Missing API key: ✅ Throws `GEMINI_NOT_CONFIGURED` with HTTP status 503 without crashing server.
- **7. Firestore Batch Item Addition:**
  - Batch insertion: ✅ 3 items inserted into Firestore under target list.
  - Document fields: ✅ Verified `isPacked: false`, `isUnpacked: false`, `containerId: null`.
  - Cascading cleanup: ✅ Test documents safely deleted after test.
- **8. Route Security (HTTP 401):**
  - `POST /api/ai/generate-weather-aware-checklist`: ✅ Returned 401 Unauthorized.
  - `POST /api/ai/generate-checklist`: ✅ Returned 401 Unauthorized.
  - `POST /api/weather/forecast`: ✅ Returned 401 Unauthorized.
  - `POST /api/lists/:listId/items/batch`: ✅ Returned 401 Unauthorized.

**Overall Test Suite Result: 25 PASSED | 0 FAILED.**

### Frontend Metro Compilation:
- Ran `npx expo export -p web --no-minify`:
- Bundled all 19 web bundles (`/`, `/lists/*`, `/ai/*`, `/(tabs)/*`) with **0 compilation errors**.

---

## 10. Manual API Setup Instructions

To enable live Google Gemini AI recommendations and OpenWeatherMap forecasts:

### Step 1: Obtain a Google Gemini API Key
1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account and click **Get API key** $\rightarrow$ **Create API key**.
3. Copy your key.

### Step 2: Obtain an OpenWeatherMap API Key
1. Visit [OpenWeatherMap](https://openweathermap.org/api).
2. Sign up for a free account.
3. Under your account profile, navigate to **My API Keys** and copy your default API key.

### Step 3: Configure `backend/.env`
Open `backend/.env` on your computer and set:
```env
PORT=5001
NODE_ENV=development
FIREBASE_SERVICE_ACCOUNT_PATH=./config/serviceAccountKey.json

# Google Gemini API
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# OpenWeatherMap API
OPENWEATHER_API_KEY=your_actual_openweather_api_key_here
```
*(Never share or paste these keys in public chat or git).*

### Step 4: Restart the Backend Server
```powershell
cd backend
npm start
```
The server will boot on `0.0.0.0:5001` with AI and weather endpoints ready.

---

## 11. Known Limitations & Roadmap

- **OpenWeatherMap 5-Day Window:** Standard free-tier forecasts are limited to 5 days into the future. Trips planned weeks or months ahead will honestly show "Weather forecast unavailable for these travel dates" and generate climate-appropriate suggestions via Gemini.
- **RFID/NFC & Container Scanning:** Scheduled for Milestone 4.
- **Geofenced Leave-Behind Alerts:** Scheduled for Milestone 5.
- **Real-Time Multi-User Collaboration:** Scheduled for Milestone 6.

