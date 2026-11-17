# PackWise — Milestone 2 Documentation: Core Packing & Intelligent Storage Management

## 1. Milestone Overview

In **Milestone 2**, PackWise transitions from the project foundation and authentication into a fully functional, real-time packing checklist, item management, and storage container organization system.

All features are connected to **Cloud Firestore** through authenticated **Express REST APIs** running on **Port 5001**. Every protected operation requires a verified Firebase ID token, strictly enforcing data isolation per user.

---

## 2. Features Implemented

### Feature A: Packing List Management
- **Dedicated Packing Lists Screen (`app/lists/index.js`):**
  - Displays all user trips and packing checklists with live progress statistics.
  - Search bar supporting case-insensitive searching across event names and destinations.
  - Status filters (`All`, `In Progress`, `Completed`).
  - Empty state with direct "Create First Packing List" call to action.
- **Create Packing List Screen (`app/lists/create.js`):**
  - Form fields: Event/Trip Name (required), Destination (required), Event Type chips (`Vacation`, `Business trip`, `College`, `Relocation`, `Daily essentials`, `Special occasion`, `Other`), Start Date (`YYYY-MM-DD`), End Date (`YYYY-MM-DD`), and Description/Notes.
  - Date consistency validation: ensures end date cannot be earlier than start date.
  - Automatically redirects directly to the newly created checklist upon submission.
- **Edit & Delete Lists:**
  - Allows editing event name, destination, dates, type, and description.
  - Confirmation dialog on deletion with safe batched deletion of all associated items to prevent orphaned Firestore documents.

### Feature B: Packing Checklist & Item Management
- **List Details & Checklist Screen (`app/lists/[id].js`):**
  - Header with destination, dates, and event type badges.
  - Dynamic progress bar card reflecting live completion percentage.
  - Add Item modal (`components/packing/AddItemModal.js`) supporting:
    - Item Name (required, non-blank)
    - Category selection (10 distinct categories)
    - Quantity stepper control (positive integer $\ge 1$)
    - Priority selector (`Low`, `Medium`, `High`)
    - Container assignment (dropdown/chips of user's storage containers)
    - Notes (optional)
  - Edit & delete individual items.
  - Category-based organization (`components/packing/CategorySection.js`) with expandable/collapsible sections.
  - Search by item name and multi-faceted filtering (by Category, Status, and Priority) with a "Clear Filters" action.

### Feature C: Real-Time Dynamic Packing Progress
- **Formula:**
  $$\text{Packing Progress} = \left(\frac{\text{Packed Items}}{\text{Total Items}}\right) \times 100$$
- Handles 0 items safely without division by zero errors ($0\%$).
- Dynamically updates upon marking items packed or unpacked.
- Dashboard progress card displays live aggregate percentage across all user checklists.

### Feature D: Unpacking Mode
- Segmented toggle control (`components/packing/PackingModeToggle.js`) switches between **Packing Mode** and **Unpacking Mode**.
- Selected mode is persisted to the packing list document in Firestore.
- **Unpacking Mode Rules:**
  - Displays items that were packed during the trip.
  - Checking an item marks it as unpacked / accounted for.
  - Dynamic unpacking progress:
    $$\text{Unpacking Progress} = \left(\frac{\text{Unpacked Items}}{\text{Packed Items}}\right) \times 100$$
  - Invariant protection: an item cannot be marked unpacked if it was never marked packed.
  - Unmarking packed status automatically resets unpacked status to false.
  - Completion celebration banner when all packed items are unpacked.

### Feature E: Intelligent Storage Manager (`app/(tabs)/storage.js`)
- Full live Firestore integration for storage containers.
- Visual container cards (`components/storage/ContainerCard.js`) with category-specific icons and colors:
  - `Suitcase` (Travel luggage)
  - `Backpack` (Carry-on laptop bag)
  - `Handbag` (Personal pouch)
  - `Duffel bag` (Gym/sports bag)
  - `Storage box` (Seasonal storage)
  - `Other`
- Live assigned items counter on each container card.
- Tap container card to view all items currently assigned to it across all trips via `ContainerItemListModal`.
- Create & edit containers (`ContainerModal.js`).
- Container deletion safety: deleting a container safely updates all assigned items to `containerId: null` using batched writes, preserving the items.

### Feature F: Live Dashboard Integration (`app/(tabs)/index.js`)
- Replaced all Milestone 1 illustrative mock values with real Firestore aggregated metrics from `/api/lists/summary/dashboard`.
- Real overall packing percentage across active checklists.
- Real count of remaining items to pack.
- Real upcoming trip preview with direct navigation to the checklist.
- Empty state with "Create Checklist" when no trips exist.
- Working quick actions navigating to `/lists/create`, `/(tabs)/storage`, and `/lists`.

---

## 3. Final Cloud Firestore Data Model

### Collection: `packingLists`
*Document ID: Auto-generated `listId`*
```json
{
  "listId": "of4hRtXlK6mvmFmstTUn",
  "userId": "firebase-auth-uid",
  "eventName": "Goa Summer Retreat",
  "destination": "Goa, India",
  "eventType": "Vacation",
  "description": "Beach vacation with friends",
  "startDate": "2026-12-15",
  "endDate": "2026-12-20",
  "mode": "packing",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

### Collection: `items`
*Document ID: Auto-generated `itemId`*
```json
{
  "itemId": "bU2x74bCwFLjVGeGwp5U",
  "userId": "firebase-auth-uid",
  "listId": "of4hRtXlK6mvmFmstTUn",
  "itemName": "Swimwear",
  "category": "Clothing",
  "quantity": 2,
  "notes": "Quick-dry fabric",
  "priority": "High",
  "isPacked": false,
  "isUnpacked": false,
  "containerId": "MBoIzuw3NWDSgxBg9yk7",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

### Collection: `containers`
*Document ID: Auto-generated `containerId`*
```json
{
  "containerId": "MBoIzuw3NWDSgxBg9yk7",
  "userId": "firebase-auth-uid",
  "containerName": "Blue Hardtop Suitcase",
  "containerType": "Suitcase",
  "description": "Main 28-inch check-in bag",
  "capacity": "25kg",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

---

## 4. Backend REST API Endpoints Implemented

All endpoints run on **Port 5001** and require `Authorization: Bearer <FIREBASE_ID_TOKEN>`.

### Packing Lists
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/lists` | Create a new packing list for authenticated user |
| `GET` | `/api/lists` | Get all packing lists for user (with progress stats) |
| `GET` | `/api/lists/summary/dashboard` | High-level summary metrics for Home Dashboard |
| `GET` | `/api/lists/:id` | Get single packing list with its items and stats |
| `PUT` | `/api/lists/:id` | Update packing list details or mode |
| `DELETE` | `/api/lists/:id` | Delete packing list and cascade-delete its items |

### Items
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/lists/:listId/items` | Add item to a packing list |
| `GET` | `/api/lists/:listId/items` | Get all items for a specific packing list |
| `GET` | `/api/items/:itemId` | Get single item details |
| `PUT` | `/api/items/:itemId` | Update item name, category, quantity, priority, container |
| `PATCH` | `/api/items/:itemId/status` | Update `isPacked` and/or `isUnpacked` status |
| `DELETE` | `/api/items/:itemId` | Delete an item |

### Containers
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/containers` | Create a storage container |
| `GET` | `/api/containers` | Get all containers for user with assigned item counts |
| `GET` | `/api/containers/:containerId` | Get container details with assigned items |
| `PUT` | `/api/containers/:containerId` | Update container name, type, description, capacity |
| `DELETE` | `/api/containers/:containerId` | Delete container and unassign items (`containerId: null`) |
| `GET` | `/api/containers/:containerId/items` | Get all items assigned to this container across all trips |

---

## 5. Security & Ownership Rules

### Backend Middleware (`backend/middleware/authMiddleware.js`)
- Rejects unauthenticated requests with `401 Unauthorized`.
- Extracts `req.user.uid` directly from verified Firebase token claims.
- Every service verifies that the resource's `userId === req.user.uid`. Attempting to access another user's list or item yields `403 Forbidden` or `404 Not Found`.

### Firestore Security Rules (`firestore.rules`)
```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
    match /packingLists/{listId} {
      allow read, update, delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }
    match /items/{itemId} {
      allow read, update, delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }
    match /containers/{containerId} {
      allow read, update, delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 6. Testing Executed

### Automated Backend & Firestore Integration Test
Executed via script against live Firestore using Firebase Admin SDK:
1. **Container Management:** Created 2 containers (`Suitcase`, `Backpack`), verified retrieval and item counts. — **PASS**
2. **Date Validation:** Verified that `endDate < startDate` is rejected with a validation error. — **PASS**
3. **List Creation:** Created list with valid dates and destination. — **PASS**
4. **Item Categorization & Container Assignment:** Created 4 items across `Clothing`, `Electronics`, `Toiletries`, `Accessories` assigned to containers. — **PASS**
5. **Dynamic Progress Recalculation:** Initial progress verified at $0\%$; marked 2 items packed, progress dynamically recalculated to $50\%$; marked remaining packed, verified $100\%$. — **PASS**
6. **Unpacking Mode Invariants:** Switched list to unpacking mode; verified unpacking progress at $25\%$. Verified that unmarking packed resets unpacked. — **PASS**
7. **Container Deletion Safety:** Deleted a container with 2 assigned items; verified container was removed and both items remained intact with `containerId: null`. — **PASS**
8. **Dashboard Summary Aggregation:** Verified accurate calculation of total lists, total items, total packed, overall percentage, and upcoming trip. — **PASS**
9. **Batched List Deletion:** Deleted packing list; verified all 4 associated items were cleaned up with 0 orphaned documents remaining in Firestore. — **PASS**

### Router & Authentication Security Test
- Verified that requests to `/api/lists`, `/api/containers`, and `/api/items` without an Authorization header are blocked with HTTP `401 Unauthorized`. — **PASS**

### Frontend Compilation & Bundling Test
- Bundled all routes and components with Metro bundler (`npx expo export -p web`). Verified 0 syntax or import errors. — **PASS**

---

## 7. Known Limitations for Milestone 2
- AI checklist generation (Gemini) is scheduled for Milestone 3.
- Weather-based packing suggestions (OpenWeatherMap) are scheduled for Milestone 3.
- Geofencing and background leave-behind notifications are scheduled for Milestone 5.
- Real-time multi-user group sync is scheduled for Milestone 6.

