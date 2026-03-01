# Phase 4D: Complete Notification System

## Overview
Add all missing notification triggers for every role, fix cross-service SSE push, verify email integration (Resend), and add cron-based reminders.

## Prerequisites
Phase 0, 1, 2, 4C.

---

## Architecture

### Current state:
- **Auth-service**: Owns the Notification model, SSE registry, and CRUD endpoints
- **Admin-service**: Has its own copy of `Notification` model and `notificationService.js`
- **Business-service**: Has its own copy of `Notification` model and `notificationService.js`
- SSE push only works within auth-service (SSE registry is in-memory, local to auth-service process)

### Problem:
When admin-service or business-service creates a notification, the SSE registry in auth-service never gets notified. The user won't see real-time updates for those notifications.

### Solution — Cross-Service Notification Push:

**Option A (HTTP Internal Push):** Each service POSTs to auth-service to trigger SSE.

Add endpoint to auth-service:

**File:** `backend/services/auth-service/src/routes/notifications.js`

> **Route mounting:** This router is mounted at `/api/notifications` in `auth-service/src/index.js`. So `router.post('/internal-push', ...)` results in the full path `POST /api/notifications/internal-push`.

```javascript
// POST /api/notifications/internal-push (internal only — not exposed to public)
router.post('/internal-push', async (req, res) => {
  const internalKey = req.headers['x-internal-key']
  if (internalKey !== process.env.INTERNAL_SERVICE_KEY) {
    return respond.error(res, 403, 'forbidden', 'Invalid internal key')
  }
  const { userId, notification } = req.body
  if (!userId || !notification) {
    return respond.error(res, 400, 'invalid_body', 'userId and notification required')
  }
  streamRegistry.push(String(userId), { type: 'new', notification })
  return respond.success(res, 200, { pushed: true })
})
```

**File:** Add to `.env` files:
```
INTERNAL_SERVICE_KEY=<random-secret>
```

**File:** Each service's `notificationService.js` — after creating notification, POST to auth:
```javascript
async function pushToSSE(userId, notification) {
  try {
    const authUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001'
    const body = JSON.stringify({ userId: String(userId), notification })
    const url = new URL(`${authUrl}/api/notifications/internal-push`)
    const http = require('http')
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'x-internal-key': process.env.INTERNAL_SERVICE_KEY,
      },
    }, () => {})
    req.on('error', () => {})
    req.write(body)
    req.end()
  } catch (_) {}
}
```

---

## Missing Notification Triggers

### Business Owner Notifications

| Event | Type (add to enum) | Trigger Location | Title Template |
|---|---|---|---|
| Payment received | `payment_received` | business-service: payment route | "Payment Confirmed" |
| Payment due reminder | `payment_due_reminder` | cron | "Payment Due Soon" |
| Renewal period started | `renewal_period_started` | renewalAutoFlag cron | "Renewal Period Open" |
| Renewal approved | `renewal_approved` | admin-service: renewal approval | "Renewal Approved" |
| Renewal rejected | `renewal_rejected` | admin-service: renewal rejection | "Renewal Rejected" |
| Post-requirement due | `post_requirement_due` | cron | "Post-Requirement Due" |
| Post-requirement overdue | `post_requirement_overdue` | cron | "Post-Requirement Overdue" |
| Post-requirement verified | `post_requirement_verified` | business-service | "Post-Requirement Verified" |
| Retirement request accepted | `retirement_accepted` | business-service: retirement | "Retirement Confirmed" |
| Retirement request rejected | `retirement_rejected` | business-service: retirement | "Retirement Rejected" |
| Violation issued | `violation_issued` | business-service: violation | "New Violation Issued" |
| Violation resolved | `violation_resolved` | business-service: violation | "Violation Resolved" |
| Edit request approved | `edit_request_approved` | admin-service | "Edit Request Approved" |
| Edit request rejected | `edit_request_rejected` | admin-service | "Edit Request Rejected" |

### LGU Officer Notifications

| Event | Type | Trigger | Title Template |
|---|---|---|---|
| New application submitted | `new_application_submitted` | business-service: submit | "New Application Received" |
| Walk-in application created | `walkin_application_created` | business-service: walk-in | "Walk-In Application Created" |
| Retirement request received | `retirement_request_received` | business-service: retirement route | "Retirement Request" |
| Edit request received | `edit_request_received` | business-service: edit request | "Edit Request Received" |
| Appeal submitted | `appeal_submitted` | business-service: appeal | "New Appeal Filed" |

### LGU Manager Notifications

| Event | Type | Trigger | Title Template |
|---|---|---|---|
| Application needs final approval | `application_needs_approval` | admin-service | "Application Awaiting Approval" |
| Inspection completed | `inspection_completed` | business-service | "Inspection Completed" |
| Violation escalation (critical) | `violation_escalated` | business-service | "Critical Violation" |
| Abandoned business detected | `abandoned_business_detected` | cron | "Abandoned Business Alert" |

### Inspector Notifications
(Already partially implemented)

| Event | Type | Trigger | Title Template |
|---|---|---|---|
| Inspection assigned | `inspection_assigned` | exists | "New Inspection Assigned" |
| Inspection rescheduled | `inspection_schedule_changed` | exists | "Inspection Rescheduled" |
| Reinspection required | `reinspection_required` | business-service | "Reinspection Required" |

### Admin Notifications
(Already mostly implemented via `createInAppNotificationsForAdmins`)

Additional:
| Event | Type | Trigger | Title Template |
|---|---|---|---|
| Penalty configuration changed | `penalty_config_changed` | admin-service | "Penalty Config Updated" |
| Fee configuration changed | `fee_config_changed` | admin-service | "Fee Config Updated" |

---

## Update Notification Model Enums

**File:** `backend/services/auth-service/src/models/Notification.js`

### Add to `type` enum:
```
'payment_received',
'payment_due_reminder',
'renewal_period_started',
'renewal_approved',
'renewal_rejected',
'post_requirement_due',
'post_requirement_overdue',
'post_requirement_verified',
'retirement_accepted',
'retirement_rejected',
'violation_issued',
'violation_resolved',
'edit_request_approved',
'edit_request_rejected',
'new_application_submitted',
'walkin_application_created',
'retirement_request_received',
'edit_request_received',
'appeal_submitted',
'application_needs_approval',
'inspection_completed',
'violation_escalated',
'abandoned_business_detected',
'reinspection_required',
'penalty_config_changed',
'fee_config_changed',
```

### Add to `relatedEntityType` enum:
```
'renewal', 'violation', 'post_requirement', 'retirement', 'edit_request', 'appeal', 'fee_configuration'
```

---

## Cron-Based Reminders

**File:** `backend/services/business-service/src/cron/notificationReminders.js` (new)

### Payment due reminder:
Runs daily at 9 AM. Finds businesses with unpaid assessments due within 7 days. Creates `payment_due_reminder` notification.

### Post-requirement due reminder:
Runs daily at 9 AM. Finds `PostRequirement` with status `'pending'` and deadline within 3 days. Creates `post_requirement_due` notification.

### Renewal reminder:
Runs daily in January. Finds active businesses without a submitted renewal. Creates `renewal_period_started` notification (only once per year).

---

## Verify Resend Email Integration

### Current state:
The user confirmed they have a Resend API key. Auth-service `lib/mailer.js` should be configured to use Resend.

### Verification steps:
1. Check `backend/services/auth-service/src/lib/mailer.js` for Resend configuration
2. Verify `.env` has `RESEND_API_KEY` set
3. Test sending an email via the existing forgot-password flow
4. Verify notification emails work for:
   - Account activity (login, password change)
   - Application status changes
   - Payment reminders

### Email types to add (if not present):
```
- Application approved email
- Application rejected email
- Renewal reminder email
- Payment due email
- Violation notice email
```

---

## Update Web NotificationHistoryPage

**File:** `web/src/features/user/pages/NotificationHistoryPage.jsx`

### Add icon mappings for new notification types:
```javascript
const typeIcons = {
  // Existing...
  payment_received: <DollarOutlined style={{ color: '#52c41a' }} />,
  payment_due_reminder: <DollarOutlined style={{ color: '#faad14' }} />,
  renewal_period_started: <CalendarOutlined />,
  violation_issued: <WarningOutlined style={{ color: '#ff4d4f' }} />,
  violation_resolved: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
  retirement_accepted: <StopOutlined />,
  new_application_submitted: <FileTextOutlined />,
  inspection_completed: <SolutionOutlined />,
  // ... etc.
}
```

---

## Edge Cases
- Cross-service SSE push is fire-and-forget; if auth-service is down, notifications still get created in DB
- Cron reminders must be idempotent — use a flag or `metadata.reminderSent` to prevent duplicates
- 7-day retention in `notificationService.getUserNotifications` means old notifications disappear; consider extending to 30 days
- SSE reconnection: web client should handle `EventSource` errors and reconnect with exponential backoff

## Acceptance Criteria
1. All 20+ new notification types are triggered at correct points
2. Cross-service SSE push works — admin-service/business-service notifications appear in real-time on web
3. Cron reminders run daily without duplicates
4. NotificationHistoryPage shows icons for all new types
5. Email notifications sent for critical events (application status, violations, payments)
6. Unread count badge updates in real-time
7. All existing notification tests still pass

## Rollback Plan
Remove new notification triggers (they're additive). Revert Notification model enum. Remove internal push endpoint.
