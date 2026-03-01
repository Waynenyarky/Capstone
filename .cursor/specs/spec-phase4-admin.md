# Phase 4: Admin Feature Completion

## Overview
Complete the admin dashboard KPIs, wire finance tabs to real backend data, add admin announcements CRUD, verify fee configuration, and add security enhancements.

## Prerequisites
Phase 0, 1, 2, 3.

---

## 4-1. Enhance Admin Dashboard KPIs

**File:** `web/src/features/admin/pages/AdminDashboard.jsx`

### Current KPIs (already wired to real data):
- Pending requests (from approvals API)
- Open tamper incidents (from tamper stats API)
- Form groups count (from form definition API)

### Add new KPIs:
| KPI | API (service) | Card Style |
|---|---|---|
| Active businesses | `GET /api/business/admin/stats` → `activeBusinesses` (business-service) | Blue |
| Pending applications | `GET /api/business/admin/stats` → `pendingApplications` (business-service) | Orange |
| Revenue this month | `GET /api/business/admin/payments/summary` → `revenueThisMonth` (business-service — same endpoint as finance tab) | Green |
| Staff count | `GET /api/admin/users/count?role=staff` (admin-service — new endpoint) | Purple |

> **Note:** The admin dashboard will need to call **two different services** (business-service and admin-service). The Vite proxy already routes `/api/business` and `/api/admin` to separate ports. The frontend should make parallel fetch calls.

### New backend endpoints needed:

**File:** `backend/services/business-service/src/routes/admin/stats.js` (new or add to existing admin routes)

```javascript
// GET /api/business/admin/stats
router.get('/stats', requireAuth, requireAdminRole, async (req, res) => {
  const activeBusinesses = await BusinessProfile.aggregate([
    { $unwind: '$businesses' },
    { $match: { 'businesses.businessStatus': 'active' } },
    { $count: 'count' },
  ])
  const pendingApplications = await BusinessProfile.aggregate([
    { $unwind: '$businesses' },
    { $match: { 'businesses.applicationStatus': { $in: ['submitted', 'under_review'] } } },
    { $count: 'count' },
  ])
  return respond.success(res, 200, {
    activeBusinesses: activeBusinesses[0]?.count || 0,
    pendingApplications: pendingApplications[0]?.count || 0,
  })
})
```

**File:** `backend/services/admin-service/src/routes/users.js` (add to existing user management routes)

```javascript
// GET /api/admin/users/count?role=staff
// Returns count of users by role for the admin dashboard KPI
router.get('/users/count', requireJwt, requireRole(['admin']), async (req, res) => {
  const { role } = req.query
  const filter = {}
  if (role) {
    const roleDoc = await Role.findOne({ slug: role })
    if (roleDoc) filter.role = roleDoc._id
  }
  const count = await User.countDocuments(filter)
  return respond.success(res, 200, { count })
})
```

---

## 4-2. Wire Finance Tabs to Real Data

### FinanceOverviewTab
**File:** `web/src/features/admin/pages/finance/FinanceOverviewTab.jsx`

**Current state:** Cards show "—" with "Connect revenue API to show data".

**Changes:**
- Fetch `GET /api/business/admin/payments/summary`
- Show: Total collections (lifetime), This month collections, Pending payments count, Total transactions count
- Cards should show real numbers with peso sign (₱)

### FinanceTransactionsTab
**File:** `web/src/features/admin/pages/finance/FinanceTransactionsTab.jsx`

**Current state:** `dataSource = []` with "Connect GET /api/business/admin/payments" note.

**Changes:**
- Fetch `GET /api/business/admin/payments?page=X&limit=20&status=all`
- Table columns: Date, Reference, Business Name, Type (initial/renewal), Amount, Method (counter/online), Status
- Pagination
- Filter by status (all/completed/pending/failed)
- Search by reference or business name

### FinanceReportsTab
**File:** `web/src/features/admin/pages/finance/FinanceReportsTab.jsx`

**Current state:** Static placeholder text.

**Changes:**
- Period selector (month/quarter/year)
- Summary stats for the selected period
- Export buttons: CSV, PDF
- `GET /api/business/admin/payments/report?period=month&year=2026&month=3`

### Backend endpoints:

**File:** `backend/services/business-service/src/routes/admin/payments.js` (new or extend existing)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/business/admin/payments/summary` | Total collections, this-month, pending count |
| `GET` | `/api/business/admin/payments` | Paginated transaction list |
| `GET` | `/api/business/admin/payments/report` | Period-based report data for export |

These endpoints query the `Payment` model (or renewal payment data within `BusinessProfile.businesses[].renewals[].payment`).

---

## 4-3. Admin Announcements CRUD

### New model:

**File:** `backend/services/admin-service/src/models/Announcement.js` (new)

```javascript
const mongoose = require('mongoose')

const AnnouncementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  body: { type: String, required: true },
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

AnnouncementSchema.index({ isActive: 1, createdAt: -1 })

module.exports = mongoose.model('Announcement', AnnouncementSchema)
```

### New routes:

**File:** `backend/services/admin-service/src/routes/announcements.js` (new)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/admin/announcements` | Public (active only) or Admin (all) | List announcements |
| `POST` | `/api/admin/announcements` | Admin | Create announcement |
| `PUT` | `/api/admin/announcements/:id` | Admin | Update announcement |
| `DELETE` | `/api/admin/announcements/:id` | Admin | Delete announcement |

Public GET returns only `isActive: true` and non-expired. Admin GET returns all.

### Wire into admin-service:

**File:** `backend/services/admin-service/src/index.js`

```javascript
const announcementsRouter = require('./routes/announcements')
app.use('/api/admin/announcements', announcementsRouter)
```

### Admin UI:

Add a new admin page or tab (could be under Dashboard or a new sidebar item):

**File:** `web/src/features/admin/pages/AdminAnnouncements.jsx` (new)

- Table with: Title, Priority, Status (active/inactive), Created, Actions
- Create/Edit modal with: Title (input), Body (textarea/rich text), Priority (select), Active (switch), Expires At (date picker)
- Delete confirmation

### Public display:

**File:** `web/src/features/public/pages/Home.jsx`

Add an announcements section that fetches `GET /api/admin/announcements` (public) and displays active announcements in a banner or card list.

---

## 4-4. Verify Fee Configuration Completeness

**File:** `web/src/features/admin/pages/AdminFeeConfiguration.jsx`

### Current tabs:
1. **Overview** — Summary of fee configs (functional)
2. **Fee by LOB** — CRUD for LOBs, Mayor's permit, tax brackets (functional)
3. **Special Fees** — Sanitary, Fire Safety (functional)
4. **Penalty & Surcharge** — Late renewal penalty config (functional)
5. **History** — Audit trail (functional)

### Verification checklist:
- [ ] Can create a new LOB fee configuration
- [ ] Can edit existing LOB fee
- [ ] Can delete LOB fee (with confirmation)
- [ ] Mayor's Permit fee saves correctly
- [ ] Tax brackets (rate/tiered/fixed) all work
- [ ] Environmental fee saves
- [ ] Sanitary fee brackets by area work
- [ ] Fire safety percentage + minimum works
- [ ] Penalty config (surcharge %, interest rate, start day) saves
- [ ] History shows all changes with timestamps and user

---

## 4-5. Security Enhancements (Admin Panel)

### Block IPs (from audit tamper page)
**File:** `web/src/features/admin/pages/auditTamper/`

Verify the admin can:
- View tamper incidents
- Block suspicious IPs
- Export security logs

### Export Audit Logs
**File:** `web/src/features/admin/pages/ExportLogsModal.jsx`

Verify:
- Export button works
- CSV/JSON format options
- Date range filter

---

## 4-6. Maintenance Mode Verification

**File:** `web/src/features/admin/pages/AdminMaintenance.jsx`

Verify:
- Toggle maintenance mode on/off
- Custom maintenance message
- Schedule maintenance window (future date)
- Non-admin users see maintenance page when active
- Admin can still access all pages during maintenance

---

## Edge Cases
- Finance summary must handle the case where no payments exist yet (show ₱0.00)
- Announcements with `expiresAt` in the past should be filtered out of public queries
- Fee configuration changes should trigger a notification to relevant staff
- Admin dashboard KPIs should handle API failures gracefully (show "—" not crash)

## Acceptance Criteria
1. Admin dashboard shows 6+ KPIs from real data
2. Finance Overview shows real revenue data
3. Finance Transactions shows paginated payment records
4. Finance Reports supports period selection and export
5. Announcements CRUD works from admin panel
6. Active announcements display on public home page
7. Fee configuration is fully functional with all 5 tabs
8. Maintenance mode toggle works
9. All admin routes build without errors

## Rollback Plan
Revert new files (Announcement model, routes, UI). Finance tab changes are additive. Dashboard KPI changes can be reverted by removing the new API calls.
