# Phase 4G: LGU Manager Backend — Analytics, Overview & Reports

## Overview
The entire LGU Manager frontend (dashboard + 4 overview pages + reports) calls 13+ API endpoints that don't exist on any backend service. This phase creates them as aggregation routes on **business-service** (which owns all the underlying models), adds the proxy/routing config, and tiers the dashboard metrics into "implement now" (simple counts from existing models) vs "implement later" (SLA, trends, workload — requires new infrastructure).

## Prerequisites
Phase 0, 1, 4C (the Inspection model enhancements are needed for some queries).

---

## Architecture Decision

**Where to host:** `backend/services/business-service/src/routes/lguManager.js` (new router)

**Rationale:** Business-service owns `BusinessProfile`, `Inspection`, `Violation`, `Appeal`, `Payment`, and `AuditLog` — all the models that LGU Manager queries aggregate against. Creating a separate microservice would just add network hops for zero benefit.

**Proxy config changes needed:**
- `web/vite.config.js` — add proxy rule for `/api/lgu-manager` → business-service (port 3002)
- `web/src/lib/http.js` — add `/api/lgu-manager` to production API origin mapping

---

## 4G-1. Proxy & Routing Configuration

### File: `web/vite.config.js`

Add to the microservices proxy section (after the `/api/business` entry, before the catch-all `/api`):
```javascript
// LGU Manager endpoints -> Business Service (port 3002)
'/api/lgu-manager': createProxyConfig('/api/lgu-manager', `http://localhost:${MICROSERVICES.business}`),
```

Also add to the unified backend proxy section:
```javascript
'/api/lgu-manager': createProxyConfig('/api/lgu-manager', UNIFIED_BACKEND_TARGET),
```

### File: `web/src/lib/http.js`

In `getProductionApiOrigin()` or `getApiOriginForPath()`, add:
```javascript
if (path.startsWith('/api/lgu-manager')) return BUSINESS_SERVICE_ORIGIN
```

### File: `docker-compose.dev.yml` / `docker-compose.yml`

No change needed — business-service already exposes port 3002. Just ensure the nginx/proxy config (if any) routes `/api/lgu-manager` to business-service.

---

## 4G-2. Auth Middleware

All LGU Manager endpoints require authentication + `lgu_manager` role.

```javascript
const { requireJwt } = require('../middleware/auth')
const respond = require('../middleware/respond')

function requireLGUManager(req, res, next) {
  const roleSlug = req.user?.role?.slug || req.user?.roleSlug
  if (!['lgu_manager', 'admin'].includes(roleSlug)) {
    return respond.error(res, 403, 'forbidden', 'LGU Manager access required')
  }
  next()
}

router.use(requireJwt, requireLGUManager)
```

---

## 4G-3. Dashboard Analytics Endpoint

### `GET /api/lgu-manager/analytics/dashboard`

This is the main endpoint that powers `LGUManagerDashboard.jsx`. The frontend expects a specific shape via `useLGUManagerDashboard`.

### Tier 1 — Implement Now (simple aggregation counts)

```javascript
router.get('/analytics/dashboard', async (req, res) => {
  const BusinessProfile = require('../models/BusinessProfile')
  const Inspection = require('../models/Inspection')
  const Violation = require('../models/Violation')
  const Appeal = require('../models/Appeal')
  const AuditLog = require('../models/AuditLog')

  const now = new Date()
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // --- Permit counts ---
  const permitStats = await BusinessProfile.aggregate([
    { $unwind: '$businesses' },
    { $group: {
      _id: null,
      total: { $sum: 1 },
      pending: { $sum: { $cond: [{ $in: ['$businesses.applicationStatus', ['submitted', 'under_review']] }, 1, 0] } },
      approved: { $sum: { $cond: [{ $eq: ['$businesses.applicationStatus', 'approved'] }, 1, 0] } },
      rejected: { $sum: { $cond: [{ $eq: ['$businesses.applicationStatus', 'rejected'] }, 1, 0] } },
      needsRevision: { $sum: { $cond: [{ $in: ['$businesses.applicationStatus', ['needs_revision', 'resubmit']] }, 1, 0] } },
    }},
  ])
  const permits = permitStats[0] || { total: 0, pending: 0, approved: 0, rejected: 0, needsRevision: 0 }

  // --- Violation counts ---
  const violationStats = await Violation.aggregate([
    { $group: {
      _id: null,
      total: { $sum: 1 },
      open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
      resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
      appealed: { $sum: { $cond: [{ $eq: ['$status', 'appealed'] }, 1, 0] } },
    }},
  ])
  const violations = violationStats[0] || { total: 0, open: 0, resolved: 0, appealed: 0 }

  // --- Inspection counts ---
  const inspectionStats = await Inspection.aggregate([
    { $group: {
      _id: null,
      total: { $sum: 1 },
      pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
      inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
      completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
      scheduled: { $sum: { $cond: [{ $gte: ['$scheduledDate', todayStart] }, 1, 0] } },
    }},
  ])
  const inspections = inspectionStats[0] || { total: 0, pending: 0, inProgress: 0, completed: 0, scheduled: 0 }

  // --- Appeal counts ---
  const appealStats = await Appeal.aggregate([
    { $group: {
      _id: null,
      total: { $sum: 1 },
      submitted: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
      underReview: { $sum: { $cond: [{ $eq: ['$status', 'under_review'] }, 1, 0] } },
      approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
      rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
    }},
  ])
  const appeals = appealStats[0] || { total: 0, submitted: 0, underReview: 0, approved: 0, rejected: 0 }

  // --- Cessation (retirement) counts ---
  const cessationStats = await BusinessProfile.aggregate([
    { $unwind: '$businesses' },
    { $match: { 'businesses.retirementStatus': { $ne: '' } } },
    { $group: {
      _id: null,
      total: { $sum: 1 },
      requested: { $sum: { $cond: [{ $eq: ['$businesses.retirementStatus', 'requested'] }, 1, 0] } },
      inspectorVerified: { $sum: { $cond: [{ $eq: ['$businesses.retirementStatus', 'inspector_verified'] }, 1, 0] } },
      confirmed: { $sum: { $cond: [{ $eq: ['$businesses.retirementStatus', 'confirmed'] }, 1, 0] } },
      rejected: { $sum: { $cond: [{ $eq: ['$businesses.retirementStatus', 'rejected'] }, 1, 0] } },
    }},
  ])
  const cessations = cessationStats[0] || { total: 0, requested: 0, inspectorVerified: 0, confirmed: 0, rejected: 0 }

  // --- Recent activity (last 20 audit events) ---
  const recentActivity = await AuditLog.find({
    eventType: { $in: [
      'business_application_submitted', 'admin_approval', 'admin_rejection',
      'business_added', 'business_updated', 'document_upload',
    ]},
  }).sort({ createdAt: -1 }).limit(20).lean()

  // --- Overdue inspections (scheduled date in the past, not completed) ---
  const overdueInspections = await Inspection.countDocuments({
    scheduledDate: { $lt: todayStart },
    status: { $ne: 'completed' },
  })

  // --- Avg processing time (approved applications, last 30 days) ---
  const processingTimes = await BusinessProfile.aggregate([
    { $unwind: '$businesses' },
    { $match: {
      'businesses.applicationStatus': 'approved',
      'businesses.submittedAt': { $exists: true, $ne: null },
      'businesses.reviewedAt': { $gte: thirtyDaysAgo },
    }},
    { $project: {
      processingMs: { $subtract: ['$businesses.reviewedAt', '$businesses.submittedAt'] },
    }},
    { $group: {
      _id: null,
      avgMs: { $avg: '$processingMs' },
      count: { $sum: 1 },
    }},
  ])
  const avgProcessingDays = processingTimes[0]
    ? Math.round((processingTimes[0].avgMs / (1000 * 60 * 60 * 24)) * 10) / 10
    : null

  return respond.success(res, 200, {
    permits: { ...permits, approvalRate: permits.total > 0 ? Math.round((permits.approved / permits.total) * 1000) / 10 : 0 },
    violations,
    inspections: { ...inspections, overdue: overdueInspections },
    appeals: { ...appeals, pending: appeals.submitted + appeals.underReview },
    cessations,
    recentActivity: recentActivity.map(a => ({
      id: a._id,
      type: a.eventType,
      description: `${a.eventType.replace(/_/g, ' ')}`,
      timestamp: a.createdAt,
      metadata: a.metadata,
    })),
    avgProcessingDays,
    // Tier 2 placeholders — return null so frontend can show "N/A"
    slaCompliance: null,
    departmentSummary: null,
    performanceTrends: null,
  })
})
```

### What the frontend needs to handle:

The `LGUManagerDashboard.jsx` uses `EMPTY_METRICS` as fallback. The response shape above covers the main KPI cards. For Tier 2 fields (`slaCompliance`, `departmentSummary`, `performanceTrends`), the frontend should show "N/A" or hide those sections when the value is `null`.

**Frontend changes needed in `LGUManagerDashboard.jsx`:**
- Map `data.permits.pending` → Permits KPI pending count
- Map `data.violations.open` → Violations KPI pending count
- Map `data.inspections` → Inspection & Compliance section
- Map `data.appeals.pending` → Appeals KPI pending count
- Map `data.cessations` → Cessation KPI counts
- Map `data.recentActivity` → Recent Activity timeline
- When `data.slaCompliance === null` → hide System Health section (or show "Coming soon")
- When `data.departmentSummary === null` → hide Department Summary section
- When `data.performanceTrends === null` → hide Performance Trends section

---

## 4G-4. Overview Endpoints (4 pages)

Each overview page needs: KPI summary + paginated table + detail.

### `GET /api/lgu-manager/overview/permits`

```javascript
router.get('/overview/permits', async (req, res) => {
  const { page = 1, limit = 20, status, search, sortBy = 'submittedAt', sortOrder = 'desc' } = req.query

  // KPI summary
  const summary = await BusinessProfile.aggregate([
    { $unwind: '$businesses' },
    { $match: { 'businesses.applicationStatus': { $nin: ['draft', 'requirements_viewed', 'form_completed'] } } },
    { $group: {
      _id: null,
      totalApplications: { $sum: 1 },
      pendingReview: { $sum: { $cond: [{ $in: ['$businesses.applicationStatus', ['submitted', 'under_review']] }, 1, 0] } },
      forCorrection: { $sum: { $cond: [{ $in: ['$businesses.applicationStatus', ['needs_revision', 'resubmit']] }, 1, 0] } },
      approved: { $sum: { $cond: [{ $eq: ['$businesses.applicationStatus', 'approved'] }, 1, 0] } },
      rejected: { $sum: { $cond: [{ $eq: ['$businesses.applicationStatus', 'rejected'] }, 1, 0] } },
    }},
  ])

  // Paginated list
  const matchStage = { 'businesses.applicationStatus': { $nin: ['draft', 'requirements_viewed', 'form_completed'] } }
  if (status) matchStage['businesses.applicationStatus'] = status
  if (search) matchStage['businesses.businessName'] = { $regex: search, $options: 'i' }

  const skip = (parseInt(page) - 1) * parseInt(limit)
  const items = await BusinessProfile.aggregate([
    { $unwind: '$businesses' },
    { $match: matchStage },
    { $sort: { [`businesses.${sortBy}`]: sortOrder === 'asc' ? 1 : -1 } },
    { $skip: skip },
    { $limit: parseInt(limit) },
    { $project: {
      _id: 0,
      applicationId: '$businesses.businessId',
      businessName: '$businesses.businessName',
      applicationStatus: '$businesses.applicationStatus',
      submittedAt: '$businesses.submittedAt',
      reviewedAt: '$businesses.reviewedAt',
      reviewedBy: '$businesses.reviewedBy',
      businessType: '$businesses.businessType',
    }},
  ])

  const totalCount = await BusinessProfile.aggregate([
    { $unwind: '$businesses' },
    { $match: matchStage },
    { $count: 'count' },
  ])

  return respond.success(res, 200, {
    summary: summary[0] || { totalApplications: 0, pendingReview: 0, forCorrection: 0, approved: 0, rejected: 0 },
    items,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalCount[0]?.count || 0,
    },
  })
})
```

### `GET /api/lgu-manager/overview/violations-inspections`

Same pattern. Aggregates from `Inspection` and `Violation`:

```javascript
router.get('/overview/violations-inspections', async (req, res) => {
  const { page = 1, limit = 20, status, type } = req.query

  // KPI summary
  const violationSummary = await Violation.aggregate([
    { $group: { _id: null,
      totalViolations: { $sum: 1 },
      open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
      resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
    }},
  ])
  const inspectionSummary = await Inspection.aggregate([
    { $group: { _id: null,
      scheduled: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
      completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
      overdue: { $sum: { $cond: [{ $and: [
        { $lt: ['$scheduledDate', new Date()] },
        { $ne: ['$status', 'completed'] },
      ]}, 1, 0] } },
    }},
  ])

  // Paginated violations list
  const skip = (parseInt(page) - 1) * parseInt(limit)
  const filter = {}
  if (status) filter.status = status

  const items = await Violation.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('inspectionId', 'businessId scheduledDate inspectorId')
    .lean()

  const total = await Violation.countDocuments(filter)

  return respond.success(res, 200, {
    summary: {
      ...(violationSummary[0] || { totalViolations: 0, open: 0, resolved: 0 }),
      ...(inspectionSummary[0] || { scheduled: 0, completed: 0, overdue: 0 }),
    },
    items,
    pagination: { page: parseInt(page), limit: parseInt(limit), total },
  })
})
```

### `GET /api/lgu-manager/overview/cessations`

Aggregates from `BusinessProfile.businesses[].retirementStatus`:

```javascript
router.get('/overview/cessations', async (req, res) => {
  const { page = 1, limit = 20, status } = req.query

  const summary = await BusinessProfile.aggregate([
    { $unwind: '$businesses' },
    { $match: { 'businesses.retirementStatus': { $nin: ['', null] } } },
    { $group: { _id: null,
      total: { $sum: 1 },
      requested: { $sum: { $cond: [{ $eq: ['$businesses.retirementStatus', 'requested'] }, 1, 0] } },
      inspectorVerified: { $sum: { $cond: [{ $eq: ['$businesses.retirementStatus', 'inspector_verified'] }, 1, 0] } },
      confirmed: { $sum: { $cond: [{ $eq: ['$businesses.retirementStatus', 'confirmed'] }, 1, 0] } },
      rejected: { $sum: { $cond: [{ $eq: ['$businesses.retirementStatus', 'rejected'] }, 1, 0] } },
    }},
  ])

  const matchStage = { 'businesses.retirementStatus': { $nin: ['', null] } }
  if (status) matchStage['businesses.retirementStatus'] = status

  const skip = (parseInt(page) - 1) * parseInt(limit)
  const items = await BusinessProfile.aggregate([
    { $unwind: '$businesses' },
    { $match: matchStage },
    { $sort: { 'businesses.retirementRequestedAt': -1 } },
    { $skip: skip },
    { $limit: parseInt(limit) },
    { $project: {
      _id: 0,
      businessId: '$businesses.businessId',
      businessName: '$businesses.businessName',
      retirementStatus: '$businesses.retirementStatus',
      requestedAt: '$businesses.retirementRequestedAt',
      businessStatus: '$businesses.businessStatus',
    }},
  ])

  const totalAgg = await BusinessProfile.aggregate([
    { $unwind: '$businesses' },
    { $match: matchStage },
    { $count: 'count' },
  ])

  return respond.success(res, 200, {
    summary: summary[0] || { total: 0, requested: 0, inspectorVerified: 0, confirmed: 0, rejected: 0 },
    items,
    pagination: { page: parseInt(page), limit: parseInt(limit), total: totalAgg[0]?.count || 0 },
  })
})
```

### `GET /api/lgu-manager/overview/appeals`

```javascript
router.get('/overview/appeals', async (req, res) => {
  const { page = 1, limit = 20, status, type } = req.query

  const summary = await Appeal.aggregate([
    { $group: { _id: null,
      total: { $sum: 1 },
      submitted: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
      underReview: { $sum: { $cond: [{ $eq: ['$status', 'under_review'] }, 1, 0] } },
      approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
      rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
    }},
  ])

  const filter = {}
  if (status) filter.status = status
  if (type) filter.appealType = type

  const skip = (parseInt(page) - 1) * parseInt(limit)
  const items = await Appeal.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean()
  const total = await Appeal.countDocuments(filter)

  return respond.success(res, 200, {
    summary: summary[0] || { total: 0, submitted: 0, underReview: 0, approved: 0, rejected: 0 },
    items,
    pagination: { page: parseInt(page), limit: parseInt(limit), total },
  })
})
```

---

## 4G-5. Analytics & Trends Endpoints

### `GET /api/lgu-manager/analytics`

General analytics with period filtering. Reuses the same aggregation logic as the dashboard but scoped by date range.

```javascript
router.get('/analytics', async (req, res) => {
  const { period = '30d', startDate, endDate } = req.query

  let dateFilter = {}
  if (startDate && endDate) {
    dateFilter = { $gte: new Date(startDate), $lte: new Date(endDate) }
  } else {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30
    dateFilter = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
  }

  // Same aggregation queries as dashboard, but filtered by date range
  // using businesses.submittedAt, Inspection.createdAt, Violation.createdAt, Appeal.createdAt

  return respond.success(res, 200, { /* same shape as dashboard, date-scoped */ })
})
```

### `GET /api/lgu-manager/analytics/trends`

**Tier 2 — stub for now.** Returns null until historical snapshot infrastructure is built.

```javascript
router.get('/analytics/trends', async (req, res) => {
  return respond.success(res, 200, {
    message: 'Trend analytics require historical data snapshots. Coming in a future update.',
    data: null,
  })
})
```

---

## 4G-6. Reports Endpoints

### `GET /api/lgu-manager/reports`

List of previously generated reports (if stored), or return empty.

```javascript
router.get('/reports', async (req, res) => {
  return respond.success(res, 200, { reports: [] })
})
```

### `POST /api/lgu-manager/reports/generate`

Generate a report based on the current analytics data. Returns aggregated data that the frontend formats into PDF/CSV.

```javascript
router.post('/reports/generate', async (req, res) => {
  const { format = 'json', period = '30d', type = 'summary' } = req.body

  // Run the same aggregations as /analytics
  const data = { /* permits, violations, inspections, appeals, cessations */ }

  return respond.success(res, 200, {
    format,
    period,
    type,
    generatedAt: new Date(),
    data,
  })
})
```

---

## 4G-7. Register Routes in Business-Service

### File: `backend/services/business-service/src/index.js`

```javascript
const lguManagerRouter = require('./routes/lguManager')
app.use('/api/lgu-manager', lguManagerRouter)
```

---

## 4G-8. Frontend Changes — Tier 2 Graceful Degradation

### File: `web/src/features/lgu-manager/pages/LGUManagerDashboard.jsx`

For Tier 2 sections that the backend returns `null` for, add conditional rendering:

```jsx
{/* System Health — only show when data exists */}
{dashboardData?.slaCompliance !== null && (
  <Card title="System Health">
    {/* existing progress bars */}
  </Card>
)}

{/* Department Summary — only show when data exists */}
{dashboardData?.departmentSummary !== null && (
  <Card title="Department Summary">
    {/* existing stats */}
  </Card>
)}

{/* Performance Trends — only show when data exists */}
{dashboardData?.performanceTrends !== null && (
  <Row gutter={16}>
    {/* existing trend cards */}
  </Row>
)}
```

This way, the dashboard looks clean with only the real data, and Tier 2 sections automatically appear when the backend starts returning them.

---

## 4G-9. Remove Hardcoded Mock Data from ReportsAnalyticsPage

### File: `web/src/features/lgu-manager/pages/ReportsAnalyticsPage.jsx`

**Remove entirely:**
```javascript
// DELETE this block (~lines 56-62):
const kpiData = {
  totalPermits: 1247,
  approvalRate: 78.5,
  avgProcessingTime: 5.2,
  activeViolations: 43,
  inspectionsCompleted: 892,
  appealsPending: 12,
}
```

**Replace with real API call:**
```javascript
const [kpiData, setKpiData] = useState(null)
const [kpiLoading, setKpiLoading] = useState(true)

useEffect(() => {
  async function loadKpis() {
    try {
      const res = await fetchJsonWithFallback('/api/lgu-manager/analytics/dashboard')
      setKpiData({
        totalPermits: res.permits?.total || 0,
        approvalRate: res.permits?.approvalRate || 0,
        avgProcessingTime: res.avgProcessingDays,
        activeViolations: res.violations?.open || 0,
        inspectionsCompleted: res.inspections?.completed || 0,
        appealsPending: res.appeals?.pending || 0,
      })
    } catch (err) {
      console.error('Failed to load KPIs:', err)
      setKpiData(null)
    } finally {
      setKpiLoading(false)
    }
  }
  loadKpis()
}, [])
```

**Also remove:**
- Hardcoded "Department Performance" stats (lines ~406-434) → show `null` / "N/A"
- Hardcoded "Anomaly & Risk" items (lines ~454-461) → show empty state
- Wire `loadAnalytics` to the filter dropdowns so Time Range and Department filters actually work

**Also remove from the 4 overview pages:**
- Hardcoded drill-down timeline data (2024 dates) → fetch from audit log or show "No activity recorded"

---

## ~~4G-10. LGU Officer Dashboard Enhancement~~ — Already in Phase 3

> This section is handled by Phase 3 section 3-3 which enhances the LGU Officer Dashboard with the same 3-card layout (pending count, review applications, profile). Do NOT duplicate this work here.

---

## Metric Tier Summary

| Metric | Tier | Data Source | Status |
|---|---|---|---|
| Total applications by status | 1 | `BusinessProfile.aggregate` | Implement now |
| Total violations by status | 1 | `Violation.aggregate` | Implement now |
| Total inspections by status | 1 | `Inspection.aggregate` | Implement now |
| Total appeals by status | 1 | `Appeal.aggregate` | Implement now |
| Cessation counts | 1 | `BusinessProfile.aggregate` | Implement now |
| Recent activity | 1 | `AuditLog.find` (last 20) | Implement now |
| Overdue inspections | 1 | `Inspection.countDocuments` | Implement now |
| Avg processing time | 1 | `BusinessProfile.aggregate` (submittedAt → reviewedAt) | Implement now |
| Approval rate | 1 | Derived from permit counts | Implement now |
| SLA compliance | **2** | Needs SLA config model + per-app tracking | Later |
| SLA breaches | **2** | Needs SLA thresholds | Later |
| Performance trends | **2** | Needs historical snapshots | Later |
| Department summary | **2** | Needs cross-service auth query | Later |
| Workload per officer | **2** | Needs assignment tracking | Later |
| Anomaly detection | **2** | Needs statistical analysis | Later |

---

## Edge Cases
- Empty database: All counts return 0, recent activity returns `[]`, dashboard shows zeros (correct behavior, not fake data)
- Large dataset performance: The aggregation queries should use indexes. Verify indexes exist on `businesses.applicationStatus`, `Violation.status`, `Inspection.status`, `Appeal.status`
- Concurrent requests: MongoDB aggregation is read-only, no concurrency issues
- Pagination edge: Page beyond total returns empty `items` array (not an error)

## Acceptance Criteria
1. All 7 `/api/lgu-manager/*` endpoints return data from real MongoDB aggregations
2. LGU Manager Dashboard shows real counts (not zeros, not mock data)
3. 4 overview pages show real paginated data with working filters
4. ReportsAnalyticsPage has zero hardcoded mock data
5. Tier 2 sections are hidden when backend returns `null`
6. LGU Officer Dashboard shows pending application count
7. Proxy config routes `/api/lgu-manager` to business-service
8. All endpoints require LGU Manager or Admin authentication
9. Web app builds without errors
10. Business-service starts without errors after adding the new router

## Rollback Plan
Delete `routes/lguManager.js`, remove the `app.use` line from `index.js`, revert proxy config. Frontend gracefully falls back to `EMPTY_METRICS` / zeros.
