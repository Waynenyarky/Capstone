# Phase 4C-A: Audit Logging & Blockchain Hardening

## Overview

The current audit system has significant gaps: 30+ state-changing operations are completely untracked, admin-service audit logs never reach the blockchain, the containment flag does nothing, and when the blockchain is down, audit records are silently abandoned. This spec closes every gap and makes the audit + blockchain + tamper-response system production-grade.

## Prerequisites

- Phase 4C (infrastructure) must be complete — cron jobs wired, audit client created
- All 4 microservices running
- Ganache deployed with contracts

## Scope

| Area | What Changes |
|---|---|
| **Audit coverage** | Add `createAuditLog` calls to 30+ untracked operations across all services |
| **Blockchain connectivity** | Fix admin-service to forward audit logs to audit-service (like auth-service and business-service already do) |
| **Blockchain status tracking** | Add `blockchainStatus` field (`pending` / `anchored` / `failed`) to all AuditLog models |
| **Schema fixes** | Add 20+ missing `eventType` values to model enums so validation doesn't silently fail |
| **Direct blockchain stubs** | Replace stub `queueBlockchainOperation` calls in business-service routes with `createAuditLog` (which already forwards to audit-service) |
| **Containment enforcement** | Add middleware that checks `containmentActive` on TamperIncident and blocks affected operations |
| **Failed anchor recovery** | Cron job to retry un-anchored logs and a forensic endpoint for tampered records |
| **Monitoring** | Expose queue status endpoint, add `blockchainStatus: 'failed'` alerting |

---

## Part 1: Fix Schema Mismatches

Before adding new audit log calls, the `eventType` enums must accept them. Each service's `AuditLog` model needs additional values.

### 1-1. Auth-service AuditLog model

**File:** `backend/services/auth-service/src/models/AuditLog.js`

Add these to the `eventType` enum (after the existing values, before the closing bracket):

```javascript
// Auth events (currently missing)
'login',
'login_failed',
'logout',
'signup',
'mfa_setup_started',
'mfa_verified',
'mfa_disable_requested',
'mfa_fingerprint_registered',
'mfa_fingerprint_removed',
'mfa_bootstrap_token_created',
'mfa_bootstrap_completed',
'webauthn_registered',
'webauthn_removed',
'first_login_credentials_changed',
'staff_created',
'office_created',
'office_updated',
'office_deleted',
'staff_role_created',
'staff_role_updated',
'staff_role_deleted',
'avatar_uploaded',
'avatar_deleted',
'pis_update',
```

### 1-2. Business-service AuditLog model

**File:** `backend/services/business-service/src/models/AuditLog.js`

Add these to the `eventType` enum:

```javascript
// Business lifecycle events
'business_deleted',
'primary_business_changed',
'risk_profile_updated',
'business_application_submitted',
'business_retirement_requested',
'business_retirement_verified',
'business_retirement_confirmed',
'business_retirement_rejected',
'business_renewal_started',
'business_renewal_submitted',
'business_renewal_approved',
'business_renewal_rejected',
// Inspection events
'inspection_created',
'inspection_started',
'inspection_submitted',
'inspection_checklist_updated',
'inspection_evidence_uploaded',
'inspection_gps_mismatch',
'inspection_acknowledged',
// Violation events
'violation_issued',
'violation_acknowledged',
'violation_resolved',
// Appeal events
'appeal_submitted',
'appeal_updated',
'appeal_resolved',
// Payment events
'payment_created',
'payment_completed',
'payment_cancelled',
// Permit events
'permit_review_started',
'permit_review',
'occupational_permit_created',
'occupational_permit_updated',
'general_permit_created',
'general_permit_updated',
// Other
'edit_request_submitted',
'edit_request_resolved',
'post_requirement_created',
'post_requirement_updated',
'walk_in_registered',
'security_event',
'restricted_field_attempt',
'error_critical',
```

Also add to the `fieldChanged` enum:

```javascript
'inspection',
'violation',
'appeal',
'payment',
'permit',
'retirement',
'renewal',
```

### 1-3. Admin-service AuditLog model

**File:** `backend/services/admin-service/src/models/AuditLog.js`

Add these to the `eventType` enum:

```javascript
// Missing admin events
'form_definition_created',
'form_definition_updated',
'form_definition_published',
'form_definition_archived',
'form_definition_duplicated',
'announcement_created',
'announcement_updated',
'announcement_deleted',
'staff_created',
'containment_activated',
'containment_deactivated',
// Already used but missing from some service enums
'contact_update',
'name_update',
'error_critical',
'restricted_field_attempt',
```

### 1-4. Audit-service AuditLog model

**File:** `backend/services/audit-service/src/models/AuditLog.js`

The audit-service model needs to accept ALL event types from ALL services (since it receives forwarded logs). Replace the enum with a superset — or simply remove the enum constraint and use `type: String, required: true` with an index. This is the **recommended approach** because adding new event types in other services shouldn't require a coordinated audit-service deploy:

```javascript
eventType: {
  type: String,
  required: true,
  index: true,
},
```

---

## Part 2: Fix Admin-Service Blockchain Forwarding

**Problem:** Admin-service's `auditLogger.js` writes to MongoDB but **never forwards to audit-service** for blockchain anchoring. Auth-service and business-service both do this correctly.

**File:** `backend/services/admin-service/src/lib/auditLogger.js`

After the `AuditLog.create()` call, add the same forwarding logic used by auth-service:

```javascript
// After: const auditLog = await AuditLog.create({ ... })
// Add:
const auditServiceUrl = process.env.AUDIT_SERVICE_URL || 'http://localhost:3004'
const headers = { 'Content-Type': 'application/json' }
if (process.env.AUDIT_SERVICE_API_KEY) headers['X-API-Key'] = process.env.AUDIT_SERVICE_API_KEY
axios.post(`${auditServiceUrl}/api/audit/log`, {
  operation: 'logAuditHash',
  params: [auditLog.hash, eventType],
  auditLogId: String(auditLog._id),
}, { headers }).catch((err) => {
  logger.warn('Failed to forward audit log to Audit Service', { error: err.message })
})
```

Also add `const axios = require('axios')` at the top of the file.

**Verification:** After this change, every `createAuditLog` call in admin-service will anchor to the blockchain via audit-service, just like auth-service and business-service already do.

---

## Part 3: Replace Direct `queueBlockchainOperation` Calls with `createAuditLog`

**Problem:** Several routes in business-service and admin-service call `queueBlockchainOperation` directly (which hits the stub and does nothing). These should instead use `createAuditLog` which both writes to MongoDB and forwards to audit-service.

### 3-1. Business-service inspection routes

**File:** `backend/services/business-service/src/routes/inspector/inspections.js`

Find all `queueBlockchainOperation('logAuditHash', ...)` calls and replace with `createAuditLog`:

**At violation creation (~line 380):**
```javascript
// REMOVE: blockchainQueue.queueBlockchainOperation('logAuditHash', [hash, 'violation_issued'], null)
// REPLACE WITH:
const { createAuditLog } = require('../../lib/auditLogger')
await createAuditLog(
  req._userId,
  'violation_issued',
  'violation',
  '',
  JSON.stringify({ violationId: violation._id, type: violation.violationType }),
  req._role || 'inspector',
  { inspectionId: req.params.id, businessId: inspection.businessId }
)
```

**At inspection submission (~line 485):**
```javascript
// REMOVE: blockchainQueue.queueBlockchainOperation('logAuditHash', [hash, 'inspection_submitted'], null)
// REPLACE WITH:
await createAuditLog(
  req._userId,
  'inspection_submitted',
  'inspection',
  '',
  JSON.stringify({ inspectionId: inspection._id, result: inspection.overallResult }),
  req._role || 'inspector',
  { businessId: inspection.businessId }
)
```

### 3-2. Admin-service permit application routes

**File:** `backend/services/admin-service/src/services/permitApplicationService.js`

Find `queueBlockchainOperation` calls (~lines 568, 799) and replace:

**At permit review started (~line 568):**
```javascript
// REMOVE: blockchainQueue.queueBlockchainOperation('logAuditHash', [...], null)
// Already has createAuditLog nearby — verify it exists and is called. If not, add:
await createAuditLog(userId, 'permit_review_started', 'applicationStatus', '', 'under_review', role, { businessId })
```

**At permit approved/rejected (~line 799):**
```javascript
// REMOVE: blockchainQueue.queueBlockchainOperation('logAuditHash', [...], null)
// Already has createAuditLog nearby — verify. If not, add:
await createAuditLog(userId, 'permit_review', 'applicationStatus', 'under_review', newStatus, role, { businessId, decision })
```

### 3-3. Admin-service alert service

**File:** `backend/services/admin-service/src/lib/adminAlertService.js`

Find `queueBlockchainOperation` calls (~lines 66, 73) and replace with `createAuditLog`. The `logCriticalEvent` blockchain call should be routed through audit-service's API:

```javascript
// REMOVE: blockchainQueue.queueBlockchainOperation('logAuditHash', [...])
// REMOVE: blockchainQueue.queueBlockchainOperation('logCriticalEvent', [...])
// These are already preceded by AuditLog.create() — add the audit-service forwarding:
const auditServiceUrl = process.env.AUDIT_SERVICE_URL || 'http://localhost:3004'
const headers = { 'Content-Type': 'application/json' }
if (process.env.AUDIT_SERVICE_API_KEY) headers['X-API-Key'] = process.env.AUDIT_SERVICE_API_KEY
axios.post(`${auditServiceUrl}/api/audit/log`, {
  operation: 'logCriticalEvent',
  params: [eventType, String(userId), JSON.stringify(details)],
  auditLogId: String(auditLog._id),
}, { headers }).catch(() => {})
```

### 3-4. Legacy gateway routes

**File:** `backend/src/routes/auth/profile.js` (~line 123)
**File:** `backend/src/routes/admin/approvals.js` (~lines 210, 224)

These call `queueBlockchainOperation` and `blockchainService` from `../../lib/` which may not exist. Verify if these routes are still active (they may be superseded by the microservice routes). If they're dead code from Phase 0 cleanup, skip. If active, replace with HTTP calls to audit-service.

---

## Part 4: Add Missing Audit Log Calls (30+ Operations)

### 4-1. Auth-service — Login

**File:** `backend/services/auth-service/src/routes/login.js`

Add at each success response point (lines ~339, ~382, ~551, ~702, ~791):

```javascript
const { createAuditLog } = require('../lib/auditLogger')

// After successful token generation, before res.json():
createAuditLog(
  user._id, 'login', 'session', '', 'active', user.role?.slug || 'business_owner',
  { method: 'email_otp', ip: req.ip, userAgent: req.get('User-Agent') }
).catch(err => logger.warn('Failed to log login audit', { error: err.message }))
```

For failed login attempts (wrong password, locked account, etc.), add:

```javascript
createAuditLog(
  user._id, 'login_failed', 'security', '', 'failed', 'unknown',
  { reason: 'invalid_credentials', ip: req.ip, userAgent: req.get('User-Agent') }
).catch(() => {})
```

### 4-2. Auth-service — Logout

**File:** `backend/services/auth-service/src/routes/logout.js`

After the notification creation, before `res.json`:

```javascript
const { createAuditLog } = require('../lib/auditLogger')

createAuditLog(
  userId, 'logout', 'session', 'active', 'ended', 'business_owner',
  { ip: req.ip }
).catch(err => console.warn('Failed to log logout audit', err.message))
```

### 4-3. Auth-service — Signup

**File:** `backend/services/auth-service/src/routes/signup.js`

At the success point of `POST /signup/verify` (~line 354):

```javascript
createAuditLog(
  newUser._id, 'signup', 'account', '', 'created', 'business_owner',
  { method: 'email_otp', ip: req.ip }
).catch(() => {})
```

### 4-4. Auth-service — MFA Enable/Disable

**File:** `backend/services/auth-service/src/routes/mfa.js`

After MFA is successfully verified/enabled:
```javascript
createAuditLog(user._id, 'mfa_verified', 'mfa', 'disabled', 'enabled', role, { method: 'totp' }).catch(() => {})
```

After MFA is disabled:
```javascript
createAuditLog(user._id, 'mfa_disabled', 'mfa', 'enabled', 'disabled', role, {}).catch(() => {})
```

### 4-5. Auth-service — WebAuthn

**File:** `backend/services/auth-service/src/routes/webauthn.js`

After passkey registered:
```javascript
createAuditLog(user._id, 'webauthn_registered', 'mfa', '', credentialId, role, { credentialName }).catch(() => {})
```

After passkey removed:
```javascript
createAuditLog(user._id, 'webauthn_removed', 'mfa', credentialId, '', role, {}).catch(() => {})
```

### 4-6. Auth-service — Staff Creation

**File:** `backend/services/auth-service/src/routes/adminUsers.js`

After `POST /admin/staff` creates a user:
```javascript
createAuditLog(req._userId, 'staff_created', 'account', '', newUser.email, req._role, { newUserId: newUser._id, role: newUser.role }).catch(() => {})
```

### 4-7. Auth-service — Avatar

**File:** `backend/services/auth-service/src/routes/profileAvatar.js`

After avatar upload success:
```javascript
createAuditLog(req._userId, 'avatar_uploaded', 'avatar', '', 'uploaded', req._role, {}).catch(() => {})
```

After avatar delete success:
```javascript
createAuditLog(req._userId, 'avatar_deleted', 'avatar', 'uploaded', 'deleted', req._role, {}).catch(() => {})
```

### 4-8. Auth-service — First Login

**File:** `backend/services/auth-service/src/routes/profileFirstLogin.js`

After credentials changed:
```javascript
createAuditLog(req._userId, 'first_login_credentials_changed', 'password', '', 'changed', req._role, {}).catch(() => {})
```

### 4-9. Business-service — Inspections (full lifecycle)

**File:** `backend/services/business-service/src/routes/inspector/inspections.js`

| Action | Event Type | When |
|---|---|---|
| POST / (create) | `inspection_created` | Inspector creates inspection |
| PATCH /:id/gps-mismatch-reason | `inspection_gps_mismatch` | GPS mismatch noted |
| PUT /:id/checklist | `inspection_checklist_updated` | Checklist updated |
| POST /:id/evidence | `inspection_evidence_uploaded` | Evidence uploaded |
| POST /:id/submit | `inspection_submitted` | (already handled in Part 3) |
| POST /:id/violations | `violation_issued` | (already handled in Part 3) |

For each, add a `createAuditLog` call with the inspection ID in metadata.

### 4-10. Business-service — Appeals

**File:** `backend/services/business-service/src/routes/appeals.js` (or wherever appeals are handled)

| Action | Event Type |
|---|---|
| POST / (submit) | `appeal_submitted` |
| PUT /:id (update) | `appeal_updated` |
| PUT /:id/resolve | `appeal_resolved` |

### 4-11. Business-service — Payments

| Action | Event Type |
|---|---|
| POST / (create) | `payment_created` |
| POST /:id/pay | `payment_completed` |
| PUT /:id/cancel | `payment_cancelled` |

### 4-12. Business-service — Retirement

| Action | Event Type |
|---|---|
| POST /retirement/:id/retire | `business_retirement_requested` |
| POST /retirement/:id/verify | `business_retirement_verified` |
| POST /retirement/:id/confirm | `business_retirement_confirmed` |
| POST /retirement/:id/reject | `business_retirement_rejected` |

### 4-13. Business-service — Renewals

| Action | Event Type |
|---|---|
| POST /business-renewal/:id/start | `business_renewal_started` |
| POST /business-renewal/:id/submit | `business_renewal_submitted` |

### 4-14. Business-service — Walk-in

After walk-in registration:
```javascript
createAuditLog(officerUserId, 'walk_in_registered', 'account', '', newUser.email, 'lgu_officer', { businessOwnerId: newUser._id }).catch(() => {})
```

### 4-15. Admin-service — Form Definitions (missing events)

**File:** `backend/services/admin-service/src/routes/formDefinitions.js`

| Action | Event Type |
|---|---|
| POST / (create) | `form_definition_created` |
| PUT /:id (update) | `form_definition_updated` |
| PUT /:id/set-active | `form_definition_published` |
| POST /:id/archive | `form_definition_archived` |
| POST /:id/duplicate | `form_definition_duplicated` |

---

## Part 5: Add `blockchainStatus` Field to AuditLog Models

### 5-1. Schema change (all 4 services)

Add to each service's `AuditLog` schema:

```javascript
blockchainStatus: {
  type: String,
  enum: ['pending', 'anchored', 'failed', 'skipped'],
  default: 'pending',
  index: true,
},
blockchainError: {
  type: String,
  default: '',
},
blockchainRetries: {
  type: Number,
  default: 0,
},
```

**Semantics:**
- `pending` — created, forwarded to audit-service, waiting for blockchain confirmation
- `anchored` — `txHash` and `blockNumber` are set; hash verified on-chain
- `failed` — all retries exhausted; `blockchainError` explains why
- `skipped` — blockchain was unavailable at creation time (no forwarding attempted)

### 5-2. Update `createAuditLog` in all services

In each service's `auditLogger.js`, set `blockchainStatus: 'pending'` at creation. If the HTTP POST to audit-service fails, update to `skipped`:

```javascript
const auditLog = await AuditLog.create({
  // ... existing fields ...
  blockchainStatus: 'pending',
})

axios.post(`${auditServiceUrl}/api/audit/log`, { ... })
  .catch(async (err) => {
    logger.warn('Failed to forward audit log to Audit Service', { error: err.message })
    await AuditLog.findByIdAndUpdate(auditLog._id, {
      blockchainStatus: 'skipped',
      blockchainError: err.message,
    }).catch(() => {})
  })
```

### 5-3. Update blockchain queue success/failure handlers

**File:** `backend/services/audit-service/src/lib/blockchainQueue.js`

On success (after updating `txHash` and `blockNumber`):
```javascript
update.blockchainStatus = 'anchored'
```

On final failure (after MAX_RETRIES):
```javascript
await AuditLog.findByIdAndUpdate(item.auditLogId, {
  blockchainStatus: 'failed',
  blockchainError: result.error || 'Max retries exceeded',
  blockchainRetries: item.retries,
}).catch(() => {})
```

### 5-4. Re-anchor cron job

**File:** `backend/services/audit-service/src/jobs/retryFailedAnchors.js` (new file)

```javascript
const AuditLog = require('../models/AuditLog')
const blockchainService = require('../lib/blockchainService')
const blockchainQueue = require('../lib/blockchainQueue')

const MAX_RETRY_AGE_HOURS = 72

async function retryFailedAnchors() {
  if (!blockchainService.isAvailable()) return

  const cutoff = new Date(Date.now() - MAX_RETRY_AGE_HOURS * 60 * 60 * 1000)

  const failedLogs = await AuditLog.find({
    blockchainStatus: { $in: ['failed', 'skipped', 'pending'] },
    txHash: { $in: ['', null] },
    createdAt: { $gte: cutoff },
  }).limit(50).lean()

  for (const log of failedLogs) {
    blockchainQueue.queueBlockchainOperation(
      'logAuditHash',
      [log.hash, log.eventType],
      String(log._id)
    )
  }

  if (failedLogs.length > 0) {
    console.log(`Retrying ${failedLogs.length} un-anchored audit logs`)
  }
}

module.exports = retryFailedAnchors
```

Schedule in `audit-service/src/jobs/index.js`:
```javascript
const retryFailedAnchors = require('./retryFailedAnchors')
scheduleJob('*/30 * * * *', retryFailedAnchors, 'retryFailedAnchors') // every 30 min
```

---

## Part 6: Containment Enforcement

### 6-1. The problem

`TamperIncident.containmentActive` is a boolean flag that admins can toggle, but **no middleware checks it**. A tampered user or business continues to operate normally.

### 6-2. Containment middleware

**File:** `backend/shared/middleware/containmentCheck.js` (new file)

```javascript
const axios = require('axios')

const ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL || 'http://localhost:3003'
let containedUserIds = new Set()
let lastRefresh = 0
const REFRESH_INTERVAL_MS = 60_000

async function refreshContainedUsers() {
  if (Date.now() - lastRefresh < REFRESH_INTERVAL_MS) return
  try {
    const headers = {}
    if (process.env.AUDIT_SERVICE_API_KEY) headers['X-API-Key'] = process.env.AUDIT_SERVICE_API_KEY
    const res = await axios.get(`${ADMIN_SERVICE_URL}/api/admin/tamper/incidents/contained-users`, { headers })
    containedUserIds = new Set(res.data.userIds || [])
    lastRefresh = Date.now()
  } catch {
    // Keep stale cache on failure
  }
}

function containmentCheck(req, res, next) {
  refreshContainedUsers().then(() => {
    if (req._userId && containedUserIds.has(String(req._userId))) {
      return res.status(423).json({
        success: false,
        error: 'Account temporarily restricted due to a security investigation. Contact an administrator.',
        code: 'ACCOUNT_CONTAINED',
      })
    }
    next()
  }).catch(() => next())
}

module.exports = { containmentCheck }
```

### 6-3. New admin-service endpoint for contained users

**File:** `backend/services/admin-service/src/routes/tamperIncidents.js`

Add a new endpoint:

```javascript
router.get('/incidents/contained-users', requireServiceAuth, async (req, res) => {
  const incidents = await TamperIncident.find({
    containmentActive: true,
    status: { $ne: 'resolved' },
  }).select('affectedUserIds').lean()

  const userIds = [...new Set(incidents.flatMap(i => i.affectedUserIds.map(String)))]
  return res.json({ userIds })
})
```

### 6-4. Wire containment middleware

Add `containmentCheck` to **state-changing routes** (not read-only ones) in:
- `auth-service/src/index.js` — after `requireJwt` on profile mutation routes
- `business-service/src/index.js` — on business submission, payment, and document routes
- `admin-service/src/index.js` — on approval and config mutation routes

Example:
```javascript
const { containmentCheck } = require('../../../shared/middleware/containmentCheck')
router.post('/submit', requireJwt, containmentCheck, async (req, res) => { ... })
```

### 6-5. Audit log the containment action

When an admin activates containment in `tamperIncidents.js`:
```javascript
await createAuditLog(req._userId, 'containment_activated', 'security', '', 'active', 'admin', {
  incidentId: incident._id,
  affectedUserIds: incident.affectedUserIds,
})
```

---

## Part 7: Monitoring & Queue Status

### 7-1. Expose queue status via API

**File:** `backend/services/audit-service/src/routes/audit.js`

Add:
```javascript
router.get('/queue-status', requireServiceAuth, async (req, res) => {
  const status = blockchainQueue.getQueueStatus()
  const pendingCount = await AuditLog.countDocuments({ blockchainStatus: 'pending', txHash: '' })
  const failedCount = await AuditLog.countDocuments({ blockchainStatus: 'failed' })
  const skippedCount = await AuditLog.countDocuments({ blockchainStatus: 'skipped' })

  return res.json({
    queue: status,
    unanchored: { pending: pendingCount, failed: failedCount, skipped: skippedCount },
    blockchainAvailable: blockchainService.isAvailable(),
  })
})
```

### 7-2. Alert on high failure count

In `verifyAuditIntegrity.js`, after the verification loop, add:

```javascript
const failedCount = await AuditLog.countDocuments({ blockchainStatus: 'failed' })
if (failedCount > 10) {
  await TamperIncident.create({
    status: 'new',
    severity: 'medium',
    verificationStatus: 'verification_error',
    message: `${failedCount} audit logs failed to anchor to blockchain. Blockchain may be unreachable.`,
    detectedAt: new Date(),
  })
}
```

---

## Part 8: Forensic Recovery Endpoint

When tampering is detected, the admin needs to understand what happened. Add an endpoint that shows the tampered record alongside the blockchain proof.

**File:** `backend/services/audit-service/src/routes/audit.js`

```javascript
router.get('/forensic/:auditLogId', requireServiceAuth, async (req, res) => {
  const auditLog = await AuditLog.findById(req.params.auditLogId).lean()
  if (!auditLog) return res.status(404).json({ error: 'Audit log not found' })

  const currentHash = calculateHash(auditLog)
  const storedHash = auditLog.hash

  let blockchainRecord = null
  if (auditLog.txHash) {
    blockchainRecord = await blockchainService.verifyHash(storedHash)
  }

  const tampered = currentHash !== storedHash

  return res.json({
    auditLog,
    forensic: {
      currentHash,
      storedHash,
      hashMatch: !tampered,
      tampered,
      blockchainRecord,
      blockchainAnchored: !!auditLog.txHash,
      blockchainVerified: blockchainRecord?.exists || false,
      diagnosis: tampered
        ? 'The MongoDB record has been modified after it was hashed. The stored hash (anchored on blockchain) represents the ORIGINAL data. The current record fields have been altered.'
        : auditLog.txHash
          ? 'Record integrity verified. MongoDB data matches the blockchain-anchored hash.'
          : 'Record has not been anchored to blockchain. Integrity cannot be verified against an immutable source.',
    },
  })
})
```

---

## Summary of Changes by Service

| Service | Files Modified | Files Created |
|---|---|---|
| **auth-service** | `models/AuditLog.js` (enum), `lib/auditLogger.js` (blockchainStatus), `routes/login.js`, `routes/logout.js`, `routes/signup.js`, `routes/mfa.js`, `routes/webauthn.js`, `routes/adminUsers.js`, `routes/profileAvatar.js`, `routes/profileFirstLogin.js` | — |
| **business-service** | `models/AuditLog.js` (enum + fieldChanged), `lib/auditLogger.js` (blockchainStatus), `routes/inspector/inspections.js` (replace stubs), appeals routes, payment routes, retirement routes, renewal routes | — |
| **admin-service** | `models/AuditLog.js` (enum), `lib/auditLogger.js` (add forwarding + blockchainStatus), `routes/formDefinitions.js`, `routes/tamperIncidents.js` (new endpoint), `lib/adminAlertService.js` (replace stubs) | — |
| **audit-service** | `models/AuditLog.js` (remove enum, add blockchainStatus), `lib/blockchainQueue.js` (update status on success/failure), `routes/audit.js` (queue-status + forensic endpoints), `jobs/verifyAuditIntegrity.js` (failure alerting) | `jobs/retryFailedAnchors.js` |
| **shared** | — | `middleware/containmentCheck.js` |

---

## Acceptance Criteria

1. **Coverage:** Every state-changing API endpoint that modifies user, business, inspection, violation, appeal, payment, form, fee, or security data has a corresponding `createAuditLog` call
2. **Blockchain anchoring:** All 4 services' audit logs reach the blockchain via audit-service (verify by checking `txHash` is populated after a few seconds)
3. **No schema errors:** Creating audit logs with any of the new event types does not throw a Mongoose validation error
4. **blockchainStatus tracking:**
   - New audit logs start with `blockchainStatus: 'pending'`
   - After blockchain confirmation: `blockchainStatus: 'anchored'`
   - After retries exhausted: `blockchainStatus: 'failed'` with `blockchainError`
   - When blockchain unavailable at creation: `blockchainStatus: 'skipped'`
5. **Re-anchor cron:** `retryFailedAnchors` job picks up `failed`/`skipped` logs and re-queues them
6. **Containment enforcement:** When `containmentActive: true` on a TamperIncident, affected users get HTTP 423 on state-changing routes
7. **Forensic endpoint:** `GET /api/audit/forensic/:id` returns hash comparison and diagnosis
8. **Queue monitoring:** `GET /api/audit/queue-status` shows queue depth and un-anchored counts
9. **Login/logout/signup** all appear in AuditLog within 1 second of the event
10. **Zero stub calls:** No remaining `queueBlockchainOperation` calls hitting the business-service or admin-service stubs

## Rollback Plan

- Schema changes (new enum values, new fields) are additive — they don't break existing records
- New `createAuditLog` calls are non-blocking (`.catch(() => {})`) — removing them doesn't affect route behavior
- The containment middleware can be disabled by removing it from the route chain
- The `retryFailedAnchors` job can be disabled by commenting out the schedule
