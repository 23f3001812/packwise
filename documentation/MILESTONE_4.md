# PackWise — Milestone 4 Technical Report
## Real-Time Collaborative Packing System & Shared Lists

**Project Title:** PackWise: An AI-Powered Context-Aware Packing and Intelligent Item Management System with Geofencing and Real-Time Collaboration  
**Milestone:** 4 of 6  
**Status:** Completed & Verified  

---

## 1. Overview & Objectives

Milestone 4 introduces **Multi-User Real-Time Collaborative Packing and Shared Lists** to PackWise. Groups, families, and travel companions can now collaborate on a single packing list simultaneously with instantaneous synchronization, robust Role-Based Access Control (RBAC), and email-based invitation lifecycles.

### Key Capabilities Delivered:
1. **Multi-User Collaboration:** Owners can share packing lists with collaborators via email invitations.
2. **Role-Based Access Control (RBAC):** Three distinct roles:
   - **Owner:** Full ownership, member management, role assignment, deletion, and editing.
   - **Editor:** Add items, edit items, toggle packed/unpacked status, delete items.
   - **Viewer:** Read-only checklist view with real-time progress observation; blocked from creating, editing, checking, or deleting items.
3. **Real-Time Data Synchronization:** Implemented via Firebase Cloud Firestore `onSnapshot` client listeners (`useCollaborativeList`, `usePendingInvitations`) with automatic state derivation and zero polling overhead.
4. **Item Authorship & Attribution:** All items record `createdBy`, `createdByName`, `updatedBy`, and `updatedByName`, displayed as non-intrusive metadata in item cards ("Added by Rohan").
5. **Invitation Lifecycle:** Formal invitations in `collaborationInvitations` supporting `pending`, `accepted`, `rejected`, `cancelled`, and `expired` statuses with duplicate check and self-invitation prevention.
6. **Collaboration Hub (`/(tabs)/groups`):** Redesigned into a comprehensive Trip Collaboration screen featuring "Shared Trips" and "Invitations" tabs with pending counts and quick actions.
7. **Members & Access Management (`/collaboration/members/[listId]`):** Active collaborator management, role toggle modal, member removal, pending invite lists, and collaborator leave actions.
8. **Security Rules & Route Protection:** Granular role enforcement in `firestore.rules` and Express backend middleware verifying Firebase ID tokens on **Port 5001**.

---

## 2. System Architecture & Real-Time Flow

```
                      +----------------------------------------------------+
                      |            Mobile Frontend (Expo / React Native)   |
                      |  - Trip Collaboration Hub: app/(tabs)/groups.js    |
                      |  - Members Management: app/collaboration/members/  |
                      |  - Live Checklist: app/lists/[id].js               |
                      |  - Lists Overview (Shared filter): app/lists/      |
                      +---------+--------------------------------+---------+
                                |                                |
                   Direct Real-Time Listeners            REST API Requests
                      (onSnapshot())                     (Bearer ID Token)
                                |                                |
                                v                                v
              +---------------------------------+  +--------------------------------+
              |         Cloud Firestore         |  |   Express Backend (Port 5001)  |
              |  - packingLists (memberIds)     |  |   /api/collaboration routes    |
              |  - packingLists/members         |  |   /api/lists/:id/items         |
              |  - items (listId query)         |  |   - Role checks & validations  |
              |  - collaborationInvitations     |  |   - Invitation state machine   |
              +---------------------------------+  +--------------------------------+
                                ^                                |
                                |                                |
                                +--------- Privileged Admin -----+
                                      (Firebase Admin SDK)
```

---

## 3. Firestore Schema Design

### 3.1. `packingLists` Document Additions
```json
{
  "listId": "NV2YTWQAfDX652YzpKe1",
  "eventName": "Shimla Group Trek",
  "destination": "Shimla, India",
  "eventType": "Adventure",
  "userId": "owner_uid_123",
  "ownerId": "owner_uid_123",
  "isCollaborative": true,
  "memberIds": ["owner_uid_123", "editor_uid_456", "viewer_uid_789"],
  "memberCount": 3,
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

### 3.2. Subcollection: `packingLists/{listId}/members/{userId}`
```json
{
  "userId": "editor_uid_456",
  "email": "rohan@example.com",
  "displayName": "Rohan (Editor)",
  "role": "editor",
  "status": "active",
  "joinedAt": "Timestamp",
  "invitedBy": "owner_uid_123"
}
```

### 3.3. Collection: `collaborationInvitations/{invitationId}`
```json
{
  "invitationId": "inv_8726354",
  "listId": "NV2YTWQAfDX652YzpKe1",
  "listName": "Shimla Group Trek",
  "destination": "Shimla, India",
  "ownerId": "owner_uid_123",
  "inviterId": "owner_uid_123",
  "inviterName": "Prachi (Owner)",
  "inviterEmail": "prachi@example.com",
  "inviteeEmail": "aditya@example.com",
  "inviteeUserId": "viewer_uid_789",
  "role": "viewer",
  "status": "pending",
  "createdAt": "Timestamp",
  "expiresAt": "Timestamp (+7 days)",
  "respondedAt": null
}
```

### 3.4. `items` Authorship Metadata Additions
```json
{
  "itemId": "item_982341",
  "listId": "NV2YTWQAfDX652YzpKe1",
  "itemName": "First Aid Kit",
  "category": "Medicines",
  "quantity": 1,
  "priority": "High",
  "isPacked": true,
  "isUnpacked": false,
  "containerId": null,
  "createdBy": "editor_uid_456",
  "createdByName": "Rohan (Editor)",
  "updatedBy": "editor_uid_456",
  "updatedByName": "Rohan (Editor)",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

---

## 4. Role-Based Access Control (RBAC) Matrix

| Operation / Action | Owner | Editor | Viewer |
| :--- | :---: | :---: | :---: |
| **View Packing List & Items** | Yes | Yes | Yes |
| **Real-Time Progress Tracking** | Yes | Yes | Yes |
| **Add New Item** | Yes | Yes | ❌ Blocked |
| **Edit Existing Item** | Yes | Yes | ❌ Blocked |
| **Check / Uncheck Item (Status)** | Yes | Yes | ❌ Blocked |
| **Delete Item** | Yes | Yes | ❌ Blocked |
| **Invite New Collaborator** | Yes | ❌ Blocked | ❌ Blocked |
| **Change Collaborator Role** | Yes | ❌ Blocked | ❌ Blocked |
| **Remove Collaborator** | Yes | ❌ Blocked | ❌ Blocked |
| **Cancel Sent Invitation** | Yes | ❌ Blocked | ❌ Blocked |
| **Edit Trip Details (Dates/Name)** | Yes | ❌ Blocked | ❌ Blocked |
| **Delete Entire Packing List** | Yes | ❌ Blocked | ❌ Blocked |
| **Leave Shared Trip** | ❌ Blocked (Must delete) | Yes | Yes |

---

## 5. Backend REST API Endpoints (Port 5001)

All endpoints require verified Firebase ID token via `Authorization: Bearer <token>`.

| Method | Endpoint | Description | Permitted Roles |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/collaboration/invitations` | Send invitation by email with specified role | List Owner |
| `GET` | `/api/collaboration/invitations/received` | List pending invitations addressed to caller's email | Authenticated User |
| `GET` | `/api/collaboration/invitations/sent?listId=<id>`| List pending invitations sent for a list | List Owner |
| `POST` | `/api/collaboration/invitations/:id/accept` | Accept invitation and join list | Invitee |
| `POST` | `/api/collaboration/invitations/:id/reject` | Reject invitation | Invitee |
| `POST` | `/api/collaboration/invitations/:id/cancel` | Cancel a sent invitation | List Owner |
| `GET` | `/api/collaboration/lists/shared-with-me` | Retrieve all collaborative lists where user is a member | Authenticated User |
| `GET` | `/api/collaboration/lists/:listId/members` | Retrieve active members and pending invites | Owner / Collaborators |
| `PATCH`| `/api/collaboration/lists/:listId/members/:userId/role` | Update collaborator role (editor <-> viewer) | List Owner |
| `DELETE`| `/api/collaboration/lists/:listId/members/:userId` | Remove collaborator from list | List Owner |
| `POST` | `/api/collaboration/lists/:listId/leave` | Leave a shared collaborative list | Collaborator (Non-Owner) |

---

## 6. Frontend Architecture & Components

### 6.1. Real-Time Hooks
- **`frontend/hooks/useCollaborativeList.js`**:
  Subscribes simultaneously to:
  1. `doc(db, 'packingLists', listId)`
  2. `query(collection(db, 'items'), where('listId', '==', listId))`
  3. `collection(db, 'packingLists', listId, 'members')`
  Computes live stats (`packingPercent`, `unpackingPercent`), resolves user's role (`isOwner`, `myRole`), and propagates instant updates without manual refresh.
- **`frontend/hooks/usePendingInvitations.js`**:
  Subscribes to `collection(db, 'collaborationInvitations')` filtered by `inviteeEmail == user.email` and `status == 'pending'`. Provides real-time badge counters across the app.

### 6.2. Screens & Features
- **Trip Collaboration Hub (`frontend/app/(tabs)/groups.js`)**:
  - Segmented control toggling between **Shared Trips** and **Invitations (N)**.
  - Quick action modal to accept or decline incoming invitations.
  - Direct navigation to shared checklists and member rosters.
- **Collaborators Roster (`frontend/app/collaboration/members/[listId].js`)**:
  - Displays Owner card and active members with role badges.
  - Role switcher dropdown modal for owners to promote/demote members.
  - Remove member button with confirmation dialog.
  - Pending invitations section with "Cancel Invitation" controls.
  - "Invite Collaborator" modal supporting email entry and Editor/Viewer role picker.
  - "Leave Trip" button for collaborators.
- **Live Checklist Screen (`frontend/app/lists/[id].js`)**:
  - Collaborator avatar stack in header with count badge.
  - Shared trip banner with navigation to `/collaboration/members/[listId]`.
  - **Viewer Read-Only Mode**: Amber banner notification, checkbox toggle disabled, "Add Item" buttons hidden, and `isReadOnly={true}` passed to category sections and items.
  - Item cards display "Added by <Name>" attribution text.
- **Lists Screen (`frontend/app/lists/index.js`)**:
  - Segmented ownership filter: **All**, **My Lists**, **Shared With Me**.
  - Distinct badges on cards: "Collaborative Trip" and "Shared With Me • Editor/Viewer".

---

## 7. Cloud Firestore Security Rules (`firestore.rules`)

Security rules enforce client-side access control adhering to the principle of least privilege:
- `isListCollaborator()` checks if user is `userId`, `ownerId`, or in `memberIds`.
- `packingLists`: Read allowed for collaborators; write allowed for owners.
- `packingLists/{listId}/members`: Read allowed for collaborators; write allowed for list owner or self (joining/leaving).
- `items`: Read and write permitted for list collaborators. Item-level viewer constraints are enforced on write operations by Express backend and client UI state.
- `collaborationInvitations`: Read and update permitted only for inviter, owner, or addressed invitee.

---

## 8. Verification & Automated Test Results

The automated test suite `backend/tests/test_milestone4.js` executed 48 comprehensive verification steps against live Firebase Cloud Firestore:

```
=======================================================
🧪 PACKWISE MILESTONE 4 VERIFICATION TEST SUITE
=======================================================

--- 0. Setup Test Users in Firestore ---
✅ PASS: Created test user profiles in Firestore

--- 1. Testing Collaborative List Initialization ---
✅ PASS: Created collaborative list with ID: FtXSWg13TTaI82joIr57
✅ PASS: List ownerId correctly matches creator UID
✅ PASS: List memberIds array contains owner
✅ PASS: Initial memberCount is 1

--- 2. Testing Self-Invitation Prevention ---
✅ PASS: Properly rejected self-invitation: "You cannot invite yourself to your own list."

--- 3. Testing Invitation Creation & Duplicate Prevention ---
✅ PASS: Invitation generated with ID: FgFFhTIYnl4XgEHBsMoz
✅ PASS: Invitation document persisted in Firestore
✅ PASS: Invitation status is "pending"
✅ PASS: Role offered is "editor"
✅ PASS: Duplicate pending invitation properly blocked: "A pending invitation has already been sent to this email address."

--- 4. Testing Invitation Acceptance & Membership Activation ---
✅ PASS: Accept invitation returned success
✅ PASS: Accepted role confirmed as "editor"
✅ PASS: Invitation marked status: "accepted"
✅ PASS: List flagged as isCollaborative: true
✅ PASS: memberIds array contains editorId
✅ PASS: memberCount incremented to 2
✅ PASS: Member document created in subcollection
✅ PASS: Member role is "editor"

--- 5. Testing Invitation Rejection & Cancellation ---
✅ PASS: Invitation status set to "rejected"
✅ PASS: Owner successfully cancelled pending invitation
✅ PASS: Viewer accepted invitation successfully

--- 6. Testing RBAC on Items & Authorship Attribution ---
✅ PASS: Editor successfully added item to shared list
✅ PASS: Item authorship createdBy matches editor UID
✅ PASS: Item authorship createdByName populated
✅ PASS: Editor successfully updated item packing status
✅ PASS: Item updatedBy tracks editor UID
✅ PASS: Viewer item creation blocked: "Viewers have read-only access and cannot modify items on this list."
✅ PASS: Viewer item status change blocked: "Viewers have read-only access and cannot modify items on this list."
✅ PASS: Viewer item deletion blocked: "Viewers have read-only access and cannot modify items on this list."

--- 7. Testing Member Role Management ---
✅ PASS: Owner promoted viewer to editor
✅ PASS: Non-owner role change blocked: "Unauthorized. Only the list owner can change member roles."

--- 8. Testing Member Removal & Leave List ---
✅ PASS: Owner removed collaborator
✅ PASS: Removed member absent from memberIds
✅ PASS: Editor successfully left the shared list
✅ PASS: Owner leave attempt properly blocked: "List owner cannot leave the list. You must delete the list instead."

--- 9. Testing Shared Lists Retrieval ---
✅ PASS: getSharedListsForUser returned array
✅ PASS: Shared list identified with correct role for collaborator

--- 10. Testing Protected Route Security Guards ---
✅ PASS: GET /api/collaboration/invitations/received rejected unauthenticated request with 401
✅ PASS: POST /api/collaboration/invitations rejected unauthenticated request with 401
✅ PASS: POST /api/collaboration/invitations/:id/accept rejected unauthenticated request with 401
✅ PASS: POST /api/collaboration/invitations/:id/reject rejected unauthenticated request with 401
✅ PASS: POST /api/collaboration/invitations/:id/cancel rejected unauthenticated request with 401
✅ PASS: GET /api/collaboration/lists/:listId/members rejected unauthenticated request with 401
✅ PASS: PATCH /api/collaboration/lists/:listId/members/:userId/role rejected unauthenticated request with 401
✅ PASS: DELETE /api/collaboration/lists/:listId/members/:userId rejected unauthenticated request with 401
✅ PASS: POST /api/collaboration/lists/:listId/leave rejected unauthenticated request with 401
✅ PASS: GET /api/collaboration/lists/shared-with-me rejected unauthenticated request with 401

--- 11. Cleaning Up Test Artifacts ---
Cleaned up test users, list, members, items, and invitations from Firestore.

=======================================================
🏁 TEST RESULTS: 48 PASSED | 0 FAILED
=======================================================
```

### Backwards Compatibility Verification:
- **Milestone 3 Regression Test:** 25 Passed | 0 Failed (`node tests/test_milestone3.js`).
- **Frontend Metro Bundler:** Bundled 1,131 modules with 0 errors via `npx expo export -p web --no-minify`.

---

## 9. Physical Testing Instructions on Android & Multi-User Setup

To test real-time collaboration with two devices (or mobile phone + desktop browser):

### Prerequisites:
1. Ensure the backend is running on Port 5001:
   ```powershell
   cd backend
   npm start
   ```
2. Ensure Expo dev server is running on the frontend:
   ```powershell
   cd frontend
   npx expo start
   ```

### Two-User Collaboration Flow:
1. **User A (Owner) on Device 1:**
   - Log in as User A.
   - Create a packing list (e.g. "Manali Expedition").
   - Tap the **Collaborators** icon in the header (or navigate to `/collaboration/members/:id`).
   - Tap **Invite Member +**, enter User B's registered email, select role **Editor**, and tap **Send Invitation**.
2. **User B (Collaborator) on Device 2:**
   - Log in as User B.
   - Open the **Groups** tab in the bottom bar.
   - Switch to the **Invitations** segment. The invitation for "Manali Expedition" will be displayed with an orange **Pending** badge.
   - Tap **Accept**.
3. **Real-Time Verification:**
   - On Device 1, the collaborator list updates instantly showing User B with the "Editor" badge.
   - On Device 2, open "Manali Expedition" from "Shared Trips" or Lists -> "Shared With Me".
   - Device 2 adds an item (e.g. "Warm Gloves").
   - **Observe Device 1:** Without touching the screen or pulling down to refresh, "Warm Gloves" appears instantly with the tag "Added by User B".
   - Device 1 checks the item box.
   - **Observe Device 2:** The progress bar increments and the item marks packed in real-time.
4. **Viewer Role Testing:**
   - On Device 1, tap User B's role badge and switch role to **Viewer**.
   - On Device 2, the checklist transitions immediately into **Viewing Mode** with an amber alert. Checkbox actions are disabled and the "Add Item" button is hidden.

