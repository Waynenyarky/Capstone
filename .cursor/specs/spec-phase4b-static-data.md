# Phase 4B: Replace All Static/Mock Data in Web Pages

## Overview
Replace all hardcoded and mock data in web pages with real API calls. This phase touches the LGU Manager reports page, finance tabs (covered in Phase 4 but validated here), and any remaining static data in business owner views.

## Prerequisites
Phase 0, 1, 2, 4, **4G** (the LGU Manager backend endpoints must exist before this phase can replace mock data with real API calls).

---

## 4B-1. ReportsAnalyticsPage — Replace Mock KPIs

> **This section is now handled by `spec-phase4g-lgu-manager-backend.md` (Phase 4G).**
> Phase 4G creates all 7 missing `/api/lgu-manager/*` backend endpoints and rewrites the ReportsAnalyticsPage to use real data. See sections 4G-3 and 4G-9 in that spec for exact changes.

**Summary of what Phase 4G does for this page:**
1. Removes the hardcoded `kpiData` object (1247, 78.5%, 5.2, etc.)
2. Fetches real KPIs from `GET /api/lgu-manager/analytics/dashboard`
3. Removes hardcoded "Department Performance" stats
4. Removes hardcoded "Anomaly & Risk" items
5. Wires `loadAnalytics` to the filter dropdowns so they actually work
6. Removes hardcoded drill-down timelines from all 4 overview pages

---

## 4B-2. LGU Manager Drill-Down Pages

> **These 4 overview pages are now handled by `spec-phase4g-lgu-manager-backend.md` (Phase 4G).**
> Phase 4G creates the 4 `/api/lgu-manager/overview/*` endpoints these pages call, and removes the hardcoded drill-down timelines. See sections 4G-4 and 4G-9 in that spec.

---

## 4B-3. AddBusinessForm Test Data Gating

**File:** `web/src/features/business-owner/components/AddBusinessForm.jsx`

### Current state:
"Fill with Test Data" button exists in two locations:
1. Standalone mode (~line 901)
2. Dashboard draft view (~line 296) — gated behind `import.meta.env.DEV`

### Changes:
- Ensure ALL test data buttons are gated behind `import.meta.env.DEV`
- The `createMockFile` and `ALAMINOS_TEST_ADDRESS` constants are fine to keep — they're only called from the test-fill function
- Verify the gating is correct: `{import.meta.env.DEV && <Button onClick={fillTestData}>Fill with Test Data</Button>}`

---

## 4B-4. Approved Business View Buttons

**File:** `web/src/features/business-owner/components/ApprovedBusinessView.jsx`

### Current state:
Has buttons like "Download Permit", "Start Renewal", "Pay Now" etc. that are likely non-functional.

### Changes (done in Phase 2, verify here):
- All buttons should be wired to real API calls or open action modals
- Verify each button:
  - **Download Permit** → calls API to get permit PDF/document
  - **Start Renewal** → opens renewal drawer (Phase 2)
  - **Pay Now** → opens payment flow
  - **View Inspections** → shows compliance tab
  - **View Violations** → shows compliance tab
- Remove any "Coming Soon" tooltips and replace with actual functionality

---

## 4B-5. Business Owner Dashboard Alerts

**File:** `web/src/features/business-owner/pages/BusinessOwnerDashboard.jsx`

If there are any static alert messages or placeholder notifications, replace with:
- Real notification count from `GET /api/notifications/unread-count`
- Active announcements from `GET /api/admin/announcements`
- Renewal reminders (from business data)

---

## 4B-6. Static Data Audit Checklist

Run a comprehensive search for patterns indicating static data:

```bash
# Search for common mock data patterns in web/src
rg -l "mock|TODO|FIXME|hardcoded|placeholder|static data|coming soon" web/src/ --type jsx --type js
rg -l "= \[\].*empty" web/src/features/admin/pages/finance/
rg -l "1247|78\.5|5\.2" web/src/features/lgu-manager/
```

For each file found, evaluate whether the static data needs replacement.

---

## Edge Cases
- APIs that don't exist yet should return graceful fallbacks (loading state, then "No data available")
- Reports KPIs with zero data should show 0, not crash
- The `avgProcessingTime` KPI requires audit log timestamps — may need to return `null` with a "N/A" display if not computed
- Test data buttons must not appear in production builds

## Acceptance Criteria
1. ReportsAnalyticsPage shows real KPIs from API (no hardcoded numbers)
2. All LGU Manager overview pages fetch real data
3. "Fill with Test Data" buttons only visible in development
4. All ApprovedBusinessView buttons are functional
5. No "Coming Soon" or "Connect API" placeholders remain in UI
6. Static data audit returns zero false positives
7. Web app builds without errors

## Rollback Plan
Revert individual file changes. New backend endpoints can be removed without breaking existing functionality.
