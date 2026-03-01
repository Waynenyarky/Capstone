# Phase 2: Business Owner Detail Panel Enhancement

## Overview
Wire `ApprovedBusinessView` into the dashboard by `applicationStatus`, enhance it with tabbed sections and action modals/drawers, and add the standalone General/Occupational Permits section. The business owner page remains a single page at `/owner` with a left-panel list and right-panel detail.

## Prerequisites
Phase 0 (cleanup), Phase 1 (routing).

---

## 2-1. Wire ApprovedBusinessView Into BusinessOwnerDashboard

**File:** `web/src/features/business-owner/pages/BusinessOwnerDashboard.jsx`

### Current behavior:
- All non-draft businesses render `PendingApplicationView` regardless of `applicationStatus`
- `ApprovedBusinessView` exists but is never imported or used

### Required change:
In the right panel section where the selected business is rendered, add a conditional:

```jsx
import ApprovedBusinessView from '../components/ApprovedBusinessView'

// In the detail render logic:
{selectedBiz.applicationStatus === 'approved' ? (
  <ApprovedBusinessView business={selectedBiz} onRefresh={loadBusinesses} />
) : selectedBiz.status === 'draft' ? (
  /* existing AddBusinessForm for draft editing */
) : (
  <PendingApplicationView business={selectedBiz} profile={...} />
)}
```

### Status mapping:
| applicationStatus | Component |
|---|---|
| `draft` | `AddBusinessForm` (editable) |
| `submitted`, `under_review`, `needs_revision`, `rejected` | `PendingApplicationView` |
| `approved` | `ApprovedBusinessView` |

---

## 2-2. Redesign ApprovedBusinessView with Tabs

**File:** `web/src/features/business-owner/components/ApprovedBusinessView.jsx`

### Current state:
A basic card view showing business info, status tag, and placeholder statistics. Has non-functional buttons.

### Target: 4-tab layout

```
┌──────────────────────────────────────────────────────┐
│ Business Name     [Status Tag]    [Actions ▼]        │
├──────────────────────────────────────────────────────┤
│ Overview | Payments | Compliance | Permits            │
├──────────────────────────────────────────────────────┤
│ [Tab Content]                                        │
└──────────────────────────────────────────────────────┘
```

### Tab 1: Overview
- Business details: name, type, registration number, address, LOB activities
- Registration date, approval date
- Current renewal status (if any)
- Quick action buttons:
  - **Start Renewal** (if renewal not started for current year, visible Jan-Mar)
  - **Retire Business** (opens retirement modal)
  - **Request Edit** (opens edit request drawer)

### Tab 2: Payments
- Fetch from `GET /api/business/businesses/:businessId/payments` (or whatever the payments endpoint is)
- Table with columns: Date, Description, Amount, Status, Reference
- **Pay Now** button for unpaid assessments → opens payment flow
- Empty state: "No payment records"

### Tab 3: Compliance
- Inspections: List from `GET /api/business/inspections?businessId=X`
- Violations: List from `GET /api/business/violations?businessId=X`
- Each inspection shows: date, type, result, inspector
- Each violation shows: type, severity, deadline, status
- Empty state: "No inspections or violations recorded"

### Tab 4: Permits
- List all permits (general + occupational) associated with this business
- Each permit: type, status, issued date, expiry
- **Download Permit** button for approved permits
- Empty state: "No permits issued yet"

### Actions dropdown:
Using Ant Design `Dropdown.Button` with:
- **View Application Form** → opens read-only AddBusinessForm in a modal
- **Request Edit** → opens a drawer with a form to request field changes
- **File Appeal** → opens a drawer for appeal submission (visible only if business has been rejected or has a violation)

---

## 2-3. Retirement Modal

**Trigger:** "Retire Business" button in Overview tab

**UI:** Ant Design `Modal` with:
1. Warning text explaining retirement is permanent
2. Reason for retirement (textarea, required)
3. Confirmation checkbox: "I understand this action will initiate the retirement process"
4. Submit button

**API:** `POST /api/business/businesses/:businessId/retire`

**Request body:**
```json
{
  "reason": "string"
}
```

**Backend behavior:**
- Sets `retirementStatus` to `'requested'`
- Sets `retirementRequestedAt` to now
- Stores `retirementReason`
- Creates notification for LGU officers

---

## 2-4. Edit Request Drawer

**Trigger:** "Request Edit" in Overview tab or Actions dropdown

**UI:** Ant Design `Drawer` with:
1. Select field(s) to edit (multi-select from business profile fields)
2. For each selected field, show current value and new proposed value
3. Reason for edit (textarea)
4. Submit button

**API:** `POST /api/business/businesses/:businessId/edit-requests`

**Request body:**
```json
{
  "fields": [
    { "fieldName": "businessName", "currentValue": "Old Name", "proposedValue": "New Name" }
  ],
  "reason": "string"
}
```

---

## 2-5. Renewal Flow

**Trigger:** "Start Renewal" button in Overview tab (visible when no renewal exists for current year)

**UI:** Multi-step drawer:
1. **Step 1:** Confirm business details (pre-filled from current data, editable)
2. **Step 2:** Upload renewal documents (dynamic form from FormDefinition)
3. **Step 3:** Review and submit

**API:** `POST /api/business/businesses/:businessId/renewals`

**Backend:** Creates a new renewal entry in `businesses[].renewals[]` with `renewalStatus: 'submitted'`

---

## 2-6. Appeal Drawer

**Trigger:** "File Appeal" from Actions dropdown (visible when business has rejection or violation)

**UI:** Ant Design `Drawer`:
1. Appeal type: Rejection Appeal or Violation Appeal
2. Subject field
3. Detailed grounds for appeal (textarea)
4. Supporting documents upload
5. Submit

**API:** `POST /api/business/businesses/:businessId/appeals`

---

## ~~2-7. Delete unused `businessItems` from useSidebar~~ — Already done in Phase 1

> Phase 1 section 1C already removes the `businessItems` array and `business: businessItems` line from `useSidebar.jsx`. No action needed here.

---

## 2-8. Standalone Permits Section

### Current state:
Business owners can only see permits within the context of a specific business.

### Target:
Add a "Permits" section to the left panel of `BusinessOwnerDashboard`, below the business list:

```
┌─────────────────┐
│ My Businesses    │
│  [Business 1]   │
│  [Business 2]   │
│  + Add Business  │
│─────────────────│
│ My Permits       │
│  [General Permits]│
│  [Occupational]  │
└─────────────────┘
```

When "General Permits" or "Occupational Permits" is clicked, the right panel shows a list of all permits of that type across all businesses.

**API needed:** `GET /api/business/permits?type=general` and `GET /api/business/permits?type=occupational`

---

## New Backend Endpoints Required

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/business/businesses/:businessId/retire` | Initiate retirement |
| `POST` | `/api/business/businesses/:businessId/edit-requests` | Submit edit request |
| `POST` | `/api/business/businesses/:businessId/renewals` | Start renewal |
| `POST` | `/api/business/businesses/:businessId/appeals` | File appeal |
| `GET` | `/api/business/businesses/:businessId/payments` | Payment history |
| `GET` | `/api/business/inspections?businessId=X` | Inspections for a business |
| `GET` | `/api/business/violations?businessId=X` | Violations for a business |
| `GET` | `/api/business/permits?type=general|occupational` | All permits by type |

Check if some of these already exist before creating new ones.

---

## Edge Cases
- Business with `retirementStatus === 'requested'` should show a "Retirement Pending" banner instead of the Retire button
- Business with open violations should show compliance alerts in the Overview tab
- Renewal button should only show in January-March (or whenever the renewal period is)
- Payment tab should handle both counter (cash) and online payments
- If business has no `applicationStatus === 'approved'`, the Permits tab should be empty

## Acceptance Criteria
1. Approved businesses render `ApprovedBusinessView` with 4 working tabs
2. All action modals/drawers open and submit correctly
3. Retirement creates a retirement request and notifies officers
4. Edit request is persisted and visible to staff
5. Renewal flow creates a renewal entry
6. No separate business owner sidebar pages — everything is within `/owner`
7. Left panel shows permits section
8. Web app builds without errors

## Rollback Plan
Revert `BusinessOwnerDashboard.jsx`, `ApprovedBusinessView.jsx`, and any new backend routes.
