# Phase 1: Critical Routing & Navigation Fixes

## Overview
Wire up missing staff routes in `App.jsx`, integrate walk-in flow into `PermitReviewPage`, fix `lgu_officer` sidebar items, and ensure all sidebar links resolve to real routes.

## Prerequisites
Phase 0 (cleanup) must be complete first.

---

## 1A. Add Missing Staff Routes in App.jsx

**File:** `web/src/App.jsx`

### Current state (lines 96–101):
```jsx
<Route path="/staff" element={<ProtectedRoute allowedRoles={['staff', 'lgu_officer', 'lgu_manager', 'inspector', 'cso']}><Outlet /></ProtectedRoute>}>
  <Route index element={<StaffDashboard />} />
  <Route path="onboarding" element={<StaffOnboarding />} />
  <Route path="applications" element={<PermitReviewPage />} />
</Route>
```

### Target state:
```jsx
<Route path="/staff" element={<ProtectedRoute allowedRoles={['staff', 'lgu_officer', 'lgu_manager', 'inspector', 'cso']}><Outlet /></ProtectedRoute>}>
  <Route index element={<StaffDashboard />} />
  <Route path="onboarding" element={<StaffOnboarding />} />
  <Route path="applications" element={<PermitReviewPage />} />
  <Route path="inspections" element={<InspectionManagementPage />} />
  <Route path="cessation" element={<CessationReviewPage />} />
  <Route path="appeals" element={<AppealsPage />} />
  <Route path="reports" element={<StaffReportsPage />} />
  <Route path="support" element={<PlaceholderPage title="Customer Support" />} />
  <Route path="recovery-request" element={<PlaceholderPage title="Account Recovery Requests" />} />
</Route>
```

### New lazy imports to add (after existing lazy imports around line 35):
```jsx
const InspectionManagementPage = lazy(() => import("@/features/staffs/lgu-officer/pages/InspectionManagementPage.jsx"))
const CessationReviewPage = lazy(() => import("@/features/staffs/lgu-officer/pages/CessationReviewPage.jsx"))
const AppealsPage = lazy(() => import("@/features/staffs/lgu-officer/pages/StaffAppealsPage.jsx"))
const StaffReportsPage = lazy(() => import("@/features/staffs/lgu-officer/pages/StaffReportsPage.jsx"))
```

### Verify these page files exist:
```
web/src/features/staffs/lgu-officer/pages/InspectionManagementPage.jsx  -> must exist
web/src/features/staffs/lgu-officer/pages/CessationReviewPage.jsx       -> must exist (or create stub)
web/src/features/staffs/lgu-officer/pages/StaffAppealsPage.jsx          -> must exist (imported as AppealsPage above)
web/src/features/staffs/lgu-officer/pages/StaffReportsPage.jsx          -> create new (Phase 3 spec)
```

If any page doesn't exist, create a minimal stub:
```jsx
import { LayoutPageHeader } from '@/features/shared'
export default function PageName() {
  return (
    <div style={{ padding: '24px' }}>
      <LayoutPageHeader title="Page Title" />
      <p>Coming soon.</p>
    </div>
  )
}
```

---

## 1B. Integrate Walk-In Application into PermitReviewPage

**File:** `web/src/features/staffs/lgu-officer/pages/PermitReviewPage.jsx`

### Current behavior:
- `PermitReviewPage` shows a list of permit applications for LGU officer review
- `WalkInApplicationPage.jsx` was a separate page with a broken import — already deleted in Phase 0

### Required changes:
1. Add a "Walk-In Application" button (Ant Design Button, type="primary") in the page header area
2. Clicking the button opens a Drawer/Modal with a walk-in flow:
   - **Step 1 — Search/Select Business Owner**: An Ant Design `AutoComplete` or `Select` with search that calls `GET /api/auth/users/search?q=<term>&role=business_owner`
   - **Step 2 — If not found**: Show "Create New Business Owner" button that opens the owner creation form inline
   - **Step 3 — Create application**: Once owner is selected, use the existing `AddBusinessForm` component (from `@/features/business-owner/components/AddBusinessForm`) to create the application on behalf of the owner
3. After submission, the new application should appear in the main application list

### New Backend Endpoint:
**File:** `backend/services/auth-service/src/routes/index.js`

Add a new route:
```javascript
// GET /api/auth/users/search?q=<term>&role=business_owner
// Requires: authenticated staff/admin
router.get('/users/search', requireAuth, requireStaffOrAdmin, async (req, res) => {
  const { q, role } = req.query
  if (!q || q.length < 2) return respond.error(res, 400, 'invalid_query', 'Search term must be at least 2 characters')

  const roleDoc = role ? await Role.findOne({ slug: role }) : null
  const filter = {
    $or: [
      { email: { $regex: q, $options: 'i' } },
      { firstName: { $regex: q, $options: 'i' } },
      { lastName: { $regex: q, $options: 'i' } },
    ],
  }
  if (roleDoc) filter.role = roleDoc._id

  const users = await User.find(filter)
    .select('firstName lastName email _id')
    .limit(20)
    .lean()

  return respond.success(res, 200, users)
})
```

Add middleware:
```javascript
function requireStaffOrAdmin(req, res, next) {
  const roleSlug = req.user?.role?.slug || req.user?.roleSlug
  if (!['admin', 'staff', 'lgu_officer', 'lgu_manager'].includes(roleSlug)) {
    return respond.error(res, 403, 'forbidden', 'Staff or admin access required')
  }
  next()
}
```

---

## 1C. Fix LGU Officer Sidebar

**File:** `web/src/features/authentication/hooks/useSidebar.jsx`

### Current `lgu_officer` items (lines 95–98):
```javascript
lgu_officer: [
  { key: 'dashboard', label: 'Dashboard', to: '/staff', icon: <DashboardOutlined /> },
  { key: 'applications', label: 'Applications', to: '/staff/applications', icon: <FileTextOutlined /> },
],
```

### Target (add profile and logout, matching other staff roles):
```javascript
lgu_officer: [
  { key: 'dashboard', label: 'Dashboard', to: '/staff', icon: <DashboardOutlined /> },
  { key: 'applications', label: 'Applications', to: '/staff/applications', icon: <FileTextOutlined /> },
  { key: 'profile', label: 'Profile / Settings', to: '/settings-profile', icon: <UserOutlined /> },
  { key: 'logout', label: 'Logout', type: 'action', icon: <LogoutOutlined /> },
],
```

### Also delete the unused `businessItems` array (lines 43–54):
The `businessItems` variable is defined but `business_owner` maps to `[]`. Remove the entire `businessItems` declaration and its `business: businessItems` backward-compat line.

### Remove from `perRole`:
```javascript
// DELETE this line:
business: businessItems,
```

---

## 1D. Remove CSO Sidebar Link (per plan)

CSO page is not being built. The sidebar currently links to `/staff/support` which is now a `PlaceholderPage`. This is acceptable — leave it as a placeholder for now.

---

## Acceptance Criteria

1. All sidebar links for every role resolve to a real route (no 404 for any sidebar item)
2. LGU officer sidebar has Dashboard, Applications, Profile, Logout
3. Walk-in application button exists on PermitReviewPage and opens a drawer/modal
4. User search endpoint works: `GET /api/auth/users/search?q=john&role=business_owner`
5. New staff routes render correct pages
6. Web app builds: `cd web && npm run build`
7. Backend auth-service starts without errors

## Rollback Plan
Revert `App.jsx`, `useSidebar.jsx`, `PermitReviewPage.jsx`, and `auth-service/routes/index.js`.
