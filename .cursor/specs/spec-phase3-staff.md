# Phase 3: Staff & Inspector Enhancements

## Overview
Ensure all staff role pages are functional, create the StaffReportsPage (personal stats only), verify onboarding flow, and fix inspector sidebar. The CSO page remains as a placeholder.

## Prerequisites
Phase 0, 1.

---

## 3-1. Verify Existing Staff Pages Work

### StaffDashboard (role-based router)
**File:** `web/src/features/staffs/pages/StaffDashboard.jsx`

**Current behavior:** Routes to role-specific dashboards:
- `lgu_officer` → `LGUOfficerDashboard`
- `lgu_manager` → `LGUManagerDashboard`
- `inspector` → `InspectorDashboard`
- `cso` → `CSODashboard`

**Verification:** Log in as each role and confirm the correct dashboard renders. Ensure onboarding redirect works when `mustChangeCredentials` or `mustSetupMfa`.

### PermitReviewPage
**File:** `web/src/features/staffs/lgu-officer/pages/PermitReviewPage.jsx`

Already functional. Phase 1 adds walk-in button. Verify:
- Table loads applications from API
- Filters work (status, search)
- `ApplicationDetailPanel` opens with full detail
- Approve/reject/request-revision flow works
- 30-second polling is active

### InspectionManagementPage
**File:** `web/src/features/staffs/lgu-officer/pages/InspectionManagementPage.jsx`

Verify:
- Fetches `/api/business/inspections`
- Assign modal works
- Detail drawer shows inspection info
- Filter by status/type works

### CessationReviewPage
**File:** `web/src/features/staffs/lgu-officer/pages/CessationReviewPage.jsx`

Verify:
- Fetches `/api/business/retirements`
- Verify/reject with reason works
- Status transitions are correct

### StaffAppealsPage
**File:** `web/src/features/staffs/lgu-officer/pages/StaffAppealsPage.jsx`

Note: This file exists as `StaffAppealsPage.jsx`. Phase 1 already imports it correctly as `AppealsPage`.

Verify:
- Fetches `/api/business/appeals?role=staff`
- Review and approve/reject works

---

## 3-2. Create StaffReportsPage

**File:** `web/src/features/staffs/lgu-officer/pages/StaffReportsPage.jsx` (new)

This page shows the individual staff member's personal activity stats — NOT the full analytics that LGU managers see.

### UI Design:
```
┌──────────────────────────────────────────────────────┐
│ My Activity Report                                    │
├──────────────────────────────────────────────────────┤
│ [Period: This Month ▼]                               │
│                                                       │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│ │ Reviews  │ │ Approved│ │ Rejected│ │ Pending  │    │
│ │   24     │ │   18    │ │   3     │ │   3      │    │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │
│                                                       │
│ Recent Activity                                       │
│ ┌───────────────────────────────────────────────┐    │
│ │ [Activity table with date, action, business]   │    │
│ └───────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

### Data source:
- `GET /api/business/admin/my-activity?period=month` (new endpoint)
- Returns: `{ totalReviews, approved, rejected, pending, recentActivity: [] }`

### Backend endpoint:

**File:** `backend/services/admin-service/src/routes/permitApplications.js` (or a new `staffActivity.js`)

> **Note:** AuditLog model exists in admin-service at `../models/AuditLog`, so this endpoint can query it directly.

```javascript
// GET /api/admin/my-activity?period=month|week|all
router.get('/my-activity', requireAuth, async (req, res) => {
  const period = req.query.period || 'month'
  const userId = req.user._id

  const dateFilter = period === 'week'
    ? { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    : period === 'month'
    ? { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    : {}

  const auditLogs = await AuditLog.find({
    performedBy: userId,
    ...(dateFilter.hasOwnProperty('$gte') ? { createdAt: dateFilter } : {}),
  }).sort({ createdAt: -1 }).limit(100).lean()

  // Aggregate counts
  const approved = auditLogs.filter(l => l.action?.includes('approved')).length
  const rejected = auditLogs.filter(l => l.action?.includes('rejected')).length
  const totalReviews = auditLogs.filter(l => l.action?.includes('review')).length

  return respond.success(res, 200, {
    totalReviews,
    approved,
    rejected,
    pending: totalReviews - approved - rejected,
    recentActivity: auditLogs.slice(0, 20),
  })
})
```

---

## 3-3. Enhance LGU Officer Dashboard

**File:** `web/src/features/staffs/lgu-officer/pages/LGUOfficerDashboard.jsx`

### Current state:
A single card (31 lines) saying "Go to Applications." The officer has zero visibility into their workload without clicking through.

### Target:
Replace with a 3-card dashboard showing today's workload:

| Card | Data | Action |
|---|---|---|
| **Pending Applications** | `Statistic` showing count from API | Click → `/staff/applications` |
| **Review Applications** | Quick-access card with description | Click → `/staff/applications` |
| **Profile & Settings** | Quick-access card | Click → `/settings-profile` |

### Data source:
Fetch pending count from `GET /api/business/admin/applications?status=submitted,under_review&limit=0` — using the pagination total as the count (avoids fetching full records).

### Implementation:
```jsx
const [stats, setStats] = useState(null)
const [loading, setLoading] = useState(true)

useEffect(() => {
  async function load() {
    try {
      const res = await get('/api/business/admin/applications?status=submitted,under_review&limit=0')
      setStats({ pendingReview: res.data?.pagination?.total || 0 })
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }
  load()
}, [])
```

Show a `Statistic` component with the pending count, a `Skeleton` during loading, and `0` if the API returns empty.

---

## 3-4. Fix Inspector Sidebar Navigation

### Current `inspector` sidebar items point to `/staff/inspections`:
```javascript
inspector: [
  { key: 'dashboard', label: 'Dashboard', to: '/staff', icon: <DashboardOutlined /> },
  { key: 'inspections', label: 'Violations / Inspections', to: '/staff/inspections', icon: <SolutionOutlined /> },
  { key: 'profile', label: 'Profile / Settings', to: '/settings-profile', icon: <UserOutlined /> },
  { key: 'logout', label: 'Logout', type: 'action', icon: <LogoutOutlined /> },
],
```

This is correct — Phase 1 adds `/staff/inspections` route pointing to `InspectionManagementPage`. Verify the page works for inspector role (filter by `inspectorId`).

---

## 3-5. Verify Onboarding Flow

### StaffOnboarding
**File:** `web/src/features/staffs/pages/StaffOnboarding.jsx`

Test the complete flow:
1. New staff account logs in
2. Redirected to `/staff/onboarding`
3. Step 1: Change temporary password
4. Step 2: Set up MFA (TOTP or passkey)
5. On completion: redirect to role-specific dashboard
6. `mustChangeCredentials` and `mustSetupMfa` flags cleared

### AdminOnboarding
**File:** `web/src/features/admin/pages/AdminOnboarding.jsx`

Same flow for admin accounts. Test:
1. New admin logs in
2. Redirected to `/admin/onboarding`
3. Password change + MFA setup
4. Redirect to `/admin/dashboard`

---

## 3-6. CSO Dashboard

**File:** `web/src/features/staffs/cso/pages/CSODashboard.jsx` (or wherever it is)

### Current state:
The StaffDashboard renders `CSODashboard` for CSO role. 

### Plan:
Keep it as a minimal dashboard with:
- Welcome card
- Link to `/staff/support` (PlaceholderPage)

The full CSO/Customer Support feature is out of scope for this phase.

---

## 3-7. LGU Manager Dashboard Verification

The LGU Manager has its own route group (`/lgu-manager/*`) with:
- Dashboard
- Reports & Analytics
- Permit Applications Overview
- Cessation Overview
- Violations & Inspections Overview
- Assign Inspection
- Appeals Overview

All pages exist and have routes. Verify they render and fetch data.

---

## Edge Cases
- Staff who have both `mustChangeCredentials` and `mustSetupMfa` must complete BOTH before accessing pages
- Inspector role should only see their own inspections (filter by `inspectorId`)
- StaffReportsPage should handle zero activity gracefully
- The `staff` role (generic) has the most sidebar items — ensure all routes exist

## Acceptance Criteria
1. All staff sidebar links resolve to functional pages
2. StaffReportsPage shows personal activity stats from real API data
3. LGU Officer Dashboard shows pending application count (not just a single card)
4. Onboarding flow works end-to-end for staff and admin
5. Inspector sees only their assigned inspections
6. CSO has a basic dashboard (not full feature)
7. No 404s when clicking any sidebar item for any role
8. Web app builds without errors

## Rollback Plan
Revert new `StaffReportsPage.jsx` and new backend endpoint. Other changes are verification-only.
