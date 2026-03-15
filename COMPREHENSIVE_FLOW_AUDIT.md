# Comprehensive Flow Audit: Registration → Permit Issuance → Renewal

> Audit Date: June 2025
> Scope: All user roles — Business Owner, LGU Officer, LGU Manager, Inspector
> Focus: Identifying broken flows, static/useless content, missing functionalities, UX pain points

---

## Table of Contents

1. [Step 1-3: Business Owner Registration & Application Submission](#step-1-3-business-owner-registration--application-submission)
2. [Step 4: LGU Officer Application Review](#step-4-lgu-officer-application-review)
3. [Step 5: Business Owner — Approved View (Post-Approval)](#step-5-business-owner--approved-view-post-approval)
4. [Step 6: LGU Manager — Inspection Assignment](#step-6-lgu-manager--inspection-assignment)
5. [Step 7: Inspector — Conducting Inspections](#step-7-inspector--conducting-inspections)
6. [Step 8: Final Approval, Permit Issuance & Progress Tracking](#step-8-final-approval-permit-issuance--progress-tracking)
7. [Renewal Flow](#renewal-flow)
8. [Cross-Cutting Issues](#cross-cutting-issues)
9. [Priority Matrix](#priority-matrix)

---

## Step 1-3: Business Owner Registration & Application Submission

**Files:**
- `web/src/features/business-owner/pages/BusinessOwnerDashboard.jsx`
- `web/src/features/business-owner/components/AddBusinessForm.jsx`
- `web/src/features/business-owner/components/PendingApplicationView.jsx`
- `web/src/features/business-owner/components/BusinessCard.jsx`

### What Works
- ✅ Dashboard has a sidebar/detail panel split layout
- ✅ Draft → Submit → Needs Revision → Resubmit lifecycle is fully wired
- ✅ `PendingApplicationView` has clear status messages, next-step guidance, and task-owner labels
- ✅ Rejected applications have an appeal flow with `submitAppeal` / `getAppeals`
- ✅ Field-level rejection reasons are displayed with `fieldReviewDecisions`
- ✅ Walk-in application creation from the LGU Officer side
- ✅ Paginated business list with search/filter

### Issues Found

| # | Severity | Issue | Details |
|---|----------|-------|---------|
| 1 | **HIGH** | **No progress/timeline indicator on pending applications** | Owner sees a status tag and message but no visual stepper or timeline showing where the application is in the overall pipeline (submitted → under review → approved). This was explicitly flagged by the user. |
| 2 | **MEDIUM** | **No document preview in PendingApplicationView** | `DocumentViewer` component exists (lines 193-244) but is never used inside the pending view. Owner can't see their uploaded documents while waiting. |
| 3 | **MEDIUM** | **No estimated processing time** | Status messages are generic ("typically takes 3-5 business days") but there's no real ETA based on queue position or historical data. |
| 4 | **LOW** | **BusinessCard doesn't show application type** | Only shows `permitStatus` and `referenceNumber`, not whether it's a new registration vs. renewal. |
| 5 | **LOW** | **Multiple `.backup.jsx` and `.refactored.jsx` files cluttering codebase** | `AddBusinessForm.backup.jsx`, `AddBusinessForm.refactored.jsx`, `ApprovedBusinessView.refactored.jsx`, `BusinessOwnerDashboard.refactored.jsx` — dead code. |
| 6 | **MEDIUM** | **`fetchBusinesses` called on every business selection** | `handleBusinessSelect` calls `fetchBusinesses()` on every click, triggering a full API reload unnecessarily. |

---

## Step 4: LGU Officer Application Review

**Files:**
- `web/src/features/staffs/lgu-officer/pages/PermitReviewPage.jsx`
- `web/src/features/staffs/lgu-officer/components/ApplicationDetailPanel.jsx`
- `web/src/features/staffs/lgu-officer/pages/LGUOfficerDashboard.jsx`
- `web/src/features/staffs/lgu-officer/pages/InspectionManagementPage.jsx`

### What Works
- ✅ Splitter-based list/detail layout for desktop; mobile fallback
- ✅ Bookmark system for officers to track applications
- ✅ 30-second polling for real-time updates
- ✅ Status filters, search, and type filters
- ✅ Walk-in application creation with owner search

### Issues Found

| # | Severity | Issue | Details |
|---|----------|-------|---------|
| 7 | **HIGH** | **LGU Officer Dashboard is nearly empty** | Only 3 cards: "Pending Applications" (stat), "Review Applications" (link), "Profile & Settings" (link). No real dashboard metrics, no inspection stats, no cessation overview, no workload summary. Compared to LGU Manager's rich dashboard, this is severely lacking. |
| 8 | **HIGH** | **InspectionManagementPage uses raw Business ID input** | When assigning inspections, the officer types a raw Business ID string (`<Input placeholder="e.g. BP-2024-00001" />`). There's no business search/select dropdown. Also requires manually typing Inspector ID. Completely unusable for a real workflow. |
| 9 | **MEDIUM** | **No link from Officer Dashboard to inspections or cessation** | Dashboard only links to `/staff/applications`. The inspection management and cessation review pages exist in routes but aren't discoverable from the dashboard. |
| 10 | **MEDIUM** | **Inspection list fetches from wrong endpoint** | `InspectionManagementPage` fetches from `/api/business/inspections` (owner endpoint) instead of an LGU officer-specific endpoint. This likely returns only the officer's own inspections or none at all. |
| 11 | **LOW** | **No notification when application status changes** | Officer reviews an app → status changes, but there's no push notification or real-time indicator for the officer about new incoming applications beyond polling. |

---

## Step 5: Business Owner — Approved View (Post-Approval)

**Files:**
- `web/src/features/business-owner/components/ApprovedBusinessView.jsx`
- `web/src/features/business-owner/components/approved-business/*.jsx`

### What Works
- ✅ Vertical tab navigation: Overview, Application Form, Payments, Compliance, Permits, Appeals, Edit Requests, Post Requirements
- ✅ Inspection acknowledgment flow works end-to-end
- ✅ Retirement lifecycle visibility (requested → inspector_verified → confirmed → rejected)
- ✅ Violation acknowledgment and status filtering
- ✅ Payment gateway modal integration
- ✅ Edit request submission with field-level changes
- ✅ Appeal filing with evidence upload

### Issues Found

| # | Severity | Issue | Details |
|---|----------|-------|---------|
| 12 | **CRITICAL** | **Approved view has no proper schedule/calendar view** | User explicitly said "no proper schedule view what the fuck." Inspections show a flat table with date filtering (All/Upcoming/Past) but no calendar visualization. The `InspectionCalendar` component exists at `/inspections/schedule` route but is NOT integrated into the approved business view. |
| 13 | **CRITICAL** | **Permits tab shows empty table — no permit issuance trigger after approval** | `PermitsTab` fetches from `getGeneralPermits` and `getOccupationalPermits` but there's no automatic permit issuance when an application is approved. The `POST /api/business/permits/issue` endpoint exists but nothing calls it automatically. Result: owner sees "No permits issued yet" forever. |
| 14 | **HIGH** | **Payments tab "Pay Total Due" uses hardcoded `cash` method** | `handlePayTotalDue` iterates pending payments and calls `processPayment(id, { paymentMethod: 'cash' })` for all of them. Doesn't let the user choose payment method for bulk payment. Individual payments open the gateway modal but "Pay Total" bypasses it. |
| 15 | **HIGH** | **Receipt download is broken** | `handleDownloadReceipt` calls `generateReceiptForPayment` and shows a success message with receipt number, but has a `// TODO: Trigger download or open in new tab` — never actually downloads anything. |
| 16 | **HIGH** | **Legacy payment modal is hidden but still in DOM** | Lines 484-546: A `<Modal>` with `style={{ display: 'none' }}` and `onOk={() => {}}` — dead code that's still rendered. |
| 17 | **MEDIUM** | **Post Requirements "Submit" sends empty documents** | `handleSubmitCompliance` calls `submitCompliance(requirementId, { submittedDocuments: [] })` — always sends an empty array. No file upload UI for submitting compliance documents. |
| 18 | **MEDIUM** | **Post Requirements "Extend" uses hardcoded reason and 30-day extension** | `handleRequestExtension` always adds 30 days with reason "Requesting additional time" — no user input for custom date or reason. |
| 19 | **MEDIUM** | **Edit Requests tab shows flat field list, not grouped by request** | `EditRequestsTab` fetches all requests but the table columns (`fieldName`, `currentValue`, `requestedValue`) suggest individual field rows, not grouped by request. If a request has 3 fields, they appear as 3 separate rows with no grouping. |
| 20 | **MEDIUM** | **Appeal drawer `beforeUpload={() => false}` — files never actually upload** | Evidence files are selected but never uploaded to a server/IPFS. The `fileList` filtering looks for `f.response?.url` which will never exist since upload is prevented. |
| 21 | **LOW** | **No "Renew" button or renewal awareness in ApprovedBusinessView** | There's no way to start renewal from the approved business view. The `RenewalWorkflowUI` is only accessible via the `/renewals` route, completely disconnected from the business context. |

---

## Step 6: LGU Manager — Inspection Assignment

**Files:**
- `web/src/features/lgu-manager/pages/AssignInspectionPage.jsx`
- `web/src/features/lgu-manager/pages/LGUManagerDashboard.jsx`
- `web/src/features/lgu-manager/components/InspectionAssignmentDashboard.jsx`

### What Works
- ✅ Dashboard has comprehensive KPI cards, charts, alerts, trends, recent activity, deadlines
- ✅ AssignInspectionPage has business/inspector dropdowns with search
- ✅ Inspector overload detection (10-assignment cap)
- ✅ Quick actions linking to sub-pages

### Issues Found

| # | Severity | Issue | Details |
|---|----------|-------|---------|
| 22 | **CRITICAL** | **No schedule/calendar view for inspections** | User explicitly flagged this. `AssignInspectionPage` has a simple `<DatePicker>` for scheduling but no calendar view showing existing inspection schedules, inspector availability, or conflicts. Completely blind scheduling. |
| 23 | **HIGH** | **No way to view/manage assigned inspections** | The page only creates new assignments. There's no table of existing inspections, no way to reschedule, cancel, or reassign. Once assigned, it disappears from this UI. |
| 24 | **HIGH** | **Dashboard data likely returns mostly zeros** | The `useLGUManagerDashboard` hook fetches dashboard data, but the backend endpoint that aggregates permits, violations, inspections, appeals, cessations, department stats, trends, recent activity, and upcoming deadlines is extremely ambitious. Many of these metrics may not be computed correctly, leading to a dashboard full of "0" values. |
| 25 | **MEDIUM** | **`InspectionAssignmentDashboard.jsx` component exists but isn't used** | There's a dedicated `InspectionAssignmentDashboard` component in the components folder that's never imported anywhere in the routes or pages. |
| 26 | **MEDIUM** | **No inspection workflow status tracking** | After assignment, there's no UI showing the inspection pipeline: assigned → inspector accepted → in progress → completed → results reviewed. |
| 27 | **LOW** | **Charts may crash with all-zero data** | `@ant-design/charts` `Pie` component with `filter(d => d.value > 0)` will render an empty pie. `ColumnChart` with all zeros renders awkwardly. |

---

## Step 7: Inspector — Conducting Inspections

**Files:**
- `web/src/features/staffs/inspector/pages/InspectorDashboard.jsx`
- `backend/services/business-service/src/routes/inspector/inspections.js`

### What Works
- ✅ Backend has complete inspection lifecycle: start → update checklist → add violations → add evidence → submit
- ✅ Notification created for business owner when inspection is completed
- ✅ Supports various evidence types and violation logging

### Issues Found

| # | Severity | Issue | Details |
|---|----------|-------|---------|
| 28 | **CRITICAL** | **Inspector Dashboard is a skeleton placeholder** | Only 3 static cards with labels "Dashboard", "Violations / Inspections", "Profile / Settings". The "Violations / Inspections" button has **no `to` prop or `onClick`** — it's completely non-functional. The "Dashboard" link goes to `/dashboard` (generic route, not inspector-specific). There is **NO inspector-specific inspection list, detail view, or submission UI on the frontend**. |
| 29 | **CRITICAL** | **No frontend for inspector to conduct inspections** | Despite the backend having full routes (`POST /:id/start`, `PUT /:id/checklist`, `POST /:id/violations`, `POST /:id/evidence`, `POST /:id/submit`), there is **zero frontend UI** for the inspector to actually use these endpoints. The inspector literally cannot do their job through the web app. |
| 30 | **HIGH** | **No inspector assignment notification** | When an inspection is assigned (by manager or officer), no notification is sent to the inspector. They have no way to know they've been assigned. |

---

## Step 8: Final Approval, Permit Issuance & Progress Tracking

**Files:**
- `backend/services/business-service/src/routes/permits.js`
- `backend/services/business-service/src/services/permitIssuanceService.js`
- `web/src/features/business-owner/components/approved-business/BusinessPermits.jsx`

### What Works
- ✅ Backend has permit issuance, download PDF, and verification endpoints
- ✅ Business owner can view permits in the Permits tab

### Issues Found

| # | Severity | Issue | Details |
|---|----------|-------|---------|
| 31 | **CRITICAL** | **No automatic permit issuance after application approval** | When an LGU officer approves an application, nothing triggers `POST /api/business/permits/issue`. The permit must be manually issued by someone, but there's no UI or automation for this. Business owners see an empty permits tab after approval. |
| 32 | **HIGH** | **No end-to-end progress tracking** | There's no unified view showing: Application Submitted → Under Review → Approved → Fees Assessed → Payment Made → Inspection Assigned → Inspection Completed → Permit Issued. Each piece exists in isolation. |
| 33 | **HIGH** | **No permit download button in business owner view** | `PermitsTab` shows a table with type/status/issued/expiry columns but no download action. The `PermitDownloadCard` component is imported in `ApprovedBusinessView` but never used in the permits tab. |
| 34 | **MEDIUM** | **Permit verification endpoint is public but has no UI** | `GET /api/business/permits/verify/:permitNumber` exists but there's no public-facing verification page. |

---

## Renewal Flow

**Files:**
- `web/src/features/business-owner/components/renewal-workflow/RenewalWorkflowUI.jsx`
- `web/src/features/business-owner/services/businessRenewalService.js`
- Route: `/renewals` (standalone page, not within business context)

### What Works
- ✅ Service layer has complete renewal API coverage (period, start, acknowledge, gross receipts, documents, assessment, payment, submit, status)
- ✅ UI has overview stats, renewal table, guide, and calendar tab

### Issues Found

| # | Severity | Issue | Details |
|---|----------|-------|---------|
| 35 | ~~CRITICAL~~ **RESOLVED** | ~~No backend routes for renewal~~ | Backend renewal routes DO exist inside `profile.js` under `// ========== BUSINESS RENEWAL ROUTES ==========`. All endpoints (period, start, acknowledge, gross-receipts, documents, assessment, payment, submit, status) are present. Initial audit grep missed them because they're in `profile.js`, not a separate file. |
| 36 | **CRITICAL** | **Renewal UI is completely disconnected from business context** | The `/renewals` route renders `<RenewalWorkflowUI />` **without a `businessId` prop**. The component requires `businessId` to function. It will call `getRenewalPeriod(undefined)` and fail immediately. |
| 37 | **HIGH** | **RenewalWorkflowUI is bloated with unused imports** | Imports `Rate`, `Transfer`, `Calendar`, `Tree`, `Collapse`, `Radio`, `Checkbox`, `Avatar`, `List`, `Steps`, `Tabs` (deprecated `TabPane`), and many icon imports — most unused. Over 60 import lines for a 700-line component. |
| 38 | **HIGH** | **Uses deprecated `TabPane` pattern** | `<Tabs><TabPane>` is deprecated in Ant Design v5. Should use `items` prop. |
| 39 | **HIGH** | **No LGU officer/manager renewal review workflow** | There's no staff-side UI or backend logic for reviewing renewal applications. Even if the owner could submit a renewal, no one can process it. |
| 40 | **MEDIUM** | **"Start Renewal" modal only asks for year** | Business owner picks a year from a DatePicker and that's it. No pre-populated data, no validation of renewal eligibility, no requirement checklist. |
| 41 | **MEDIUM** | **Static "Renewal Guide" and "Need Help?" sections** | All content is hardcoded text. Not configurable, not dynamic. |
| 42 | **LOW** | **Calendar tab renders a bare `<Calendar fullscreen={false} />` with no data** | Shows a generic Ant Design calendar with no renewal dates or deadlines populated. |

---

## Cross-Cutting Issues

| # | Severity | Issue | Details |
|---|----------|-------|---------|
| 43 | **HIGH** | **No unified notification system** | Backend `createNotification` exists but frontend `NotificationHistoryPage` may not properly poll or display different notification types. Inspection completion notifications were added but assignment notifications, payment reminders, and deadline alerts are missing. |
| 44 | **HIGH** | **No real-time updates** | Only `PermitReviewPage` polls (30s). All other pages require manual refresh. No WebSocket or SSE. |
| 45 | **MEDIUM** | **Inconsistent data contracts between backend and frontend** | Normalization layers were added for inspections and violations, but payments, permits, appeals, and edit requests still have potential shape mismatches (`data.data` vs `data.permits` vs array). |
| 46 | **MEDIUM** | **No role-based navigation guard for staff sub-routes** | `/staff/*` routes allow `['staff', 'lgu_officer', 'lgu_manager', 'inspector', 'cso']` — any staff role can access officer-specific pages like `PermitReviewPage`. |
| 47 | **MEDIUM** | **Phase 2 components exist but are poorly integrated** | `PortfolioDashboard`, `AdvancedPaymentDashboard`, `ComplianceDashboard`, `MobileDashboard`, `ClearanceTracker`, `InspectionCalendar` all have routes but are standalone pages with no navigation from the main dashboard. |
| 48 | **LOW** | **Dead code and duplicate files** | `.backup.jsx`, `.refactored.jsx` files, hidden modals (`display: none`), `BusinessCompliance.jsx` in `approved-business/` folder duplicates logic inside `ApprovedBusinessView.jsx`. |

---

## Priority Matrix

### 🔴 CRITICAL (Must fix — broken core flows)

1. **#28-29**: Inspector has NO usable frontend — cannot conduct inspections
2. **#35-36**: Renewal flow has NO backend routes — entire feature is non-functional
3. **#31**: No automatic permit issuance after approval — owners never get permits
4. **#13**: Permits tab always empty because of #31
5. **#22**: No inspection schedule/calendar view (LGU Manager)
6. **#12**: No inspection schedule/calendar view (Business Owner)

### 🟠 HIGH (Significant functionality gaps)

7. **#7**: LGU Officer Dashboard is nearly empty
8. **#8**: Inspection assignment uses raw text input, not searchable selects
9. **#14-15-16**: Payment flow issues (hardcoded method, broken receipt, dead modal)
10. **#23**: No existing inspection management after assignment
11. **#30**: No inspector assignment notification
12. **#32-33**: No progress tracking, no permit download
13. **#39**: No renewal review workflow on staff side
14. **#1**: No progress indicator on pending applications
15. **#43-44**: Missing notifications and real-time updates

### 🟡 MEDIUM (Usability/completeness gaps)

16. **#17-18**: Post-requirements submit/extend are stubbed
17. **#19-20**: Edit requests ungrouped, appeal evidence upload broken
18. **#45-46-47**: Data contracts, role guards, Phase 2 integration
19. **#6-10-11**: Unnecessary API calls, wrong endpoints, missing links

### 🟢 LOW (Polish/cleanup)

20. **#4-5-21-27-41-42-48**: Card info, dead code, static content, empty calendar
