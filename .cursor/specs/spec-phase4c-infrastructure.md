# Phase 4C: Bug Fixes & Infrastructure Wiring

## Overview
Fix the Violation model query bug, enhance the Inspection model for surprise inspections and permit revocation, wire up renewal/abandoned cron jobs, implement post-requirements tracking, and connect blockchain audit logging from business/admin services.

## Prerequisites
Phase 0, 1, 2.

---

## 4C-1. Fix Violation Query Bug in Retirement Route

**File:** `backend/services/business-service/src/routes/retirement.js`

### Bug (around line 35-49):
```javascript
const openViolations = await Violation.countDocuments({
  businessId,                              // BUG: Violation has no businessId field
  status: { $in: ['open', 'pending'] },    // BUG: 'pending' is not in the enum
})
```

### Root cause:
- `Violation` model only has `inspectionId`, not `businessId`
- `Violation.status` enum is `['open', 'resolved', 'appealed']` — `'pending'` is invalid
- This query always returns 0, so businesses with open violations can retire

### Fix:
```javascript
const Inspection = require('../models/Inspection')

// Find all inspections for this business
const inspections = await Inspection.find({
  businessProfileId: profileId,
  businessId: businessId,
}).select('_id').lean()

const inspectionIds = inspections.map(i => i._id)

// Check for open violations across those inspections
const openViolations = inspectionIds.length > 0
  ? await Violation.countDocuments({
      inspectionId: { $in: inspectionIds },
      status: 'open',
    })
  : 0

if (openViolations > 0) {
  return respond.error(res, 400, 'open_violations', `Cannot retire: ${openViolations} open violation(s) must be resolved first`)
}
```

---

## 4C-2. Enhance Inspection Model

**File:** `backend/services/business-service/src/models/Inspection.js`

### Add new fields:
```javascript
// Add to the schema (verify each doesn't already exist before adding):
isSurprise: { type: Boolean, default: false },
compliancePeriodEnd: { type: Date, default: null },
permitRevoked: { type: Boolean, default: false },
revokedAt: { type: Date, default: null },
revokedReason: { type: String, default: '' },
reinspectionDeadline: { type: Date, default: null },
notes: { type: String, default: '' },
```

> **Note:** `assignedBy` and `assignedAt` already exist on the Inspection schema. Do NOT re-add them.

### Add to `inspectionType` enum:
Current: `['initial', 'renewal', 'follow_up', 'joint', 'compliance', 'complaint']`
Add: `'surprise'`, `'routine'`

### Add `complianceStatus` field:
```javascript
complianceStatus: {
  type: String,
  enum: ['compliant', 'non_compliant', 'pending_reinspection', null],
  default: null,
},
```

---

## 4C-3. Add Permit Revocation Fields to BusinessProfile

**File:** `backend/services/business-service/src/models/BusinessProfile.js`

### Add to the `businesses[]` subdocument schema:
```javascript
permitRevoked: { type: Boolean, default: false },
revokedAt: { type: Date, default: null },
revokedReason: { type: String, default: '' },
```

These fields are set when an inspection reveals critical non-compliance and the LGU manager revokes the permit.

---

## 4C-4. Wire Up Cron Jobs

**File:** `backend/services/business-service/src/index.js`

### Prerequisite: Install node-cron
```bash
cd backend && npm install node-cron
```
`node-cron` is NOT currently in business-service's dependencies. It must be installed first.

### Current state:
The cron functions exist in `src/cron/renewalAutoFlag.js` and `src/cron/abandonedDetection.js` but are not scheduled.

### Changes:
```javascript
const cron = require('node-cron')

// Already in the file or add:
const { flagBusinessesForRenewal, calculateMonthlyInterest } = require('./cron/renewalAutoFlag')
const { detectAbandonedBusinesses, markBusinessAbandoned } = require('./cron/abandonedDetection')

// Schedule renewal flagging: January 1 at midnight
cron.schedule('0 0 1 1 *', async () => {
  console.log('[CRON] Running renewal auto-flag...')
  try { await flagBusinessesForRenewal() }
  catch (err) { console.error('[CRON] renewalAutoFlag error:', err) }
})

// Schedule monthly interest calculation: 1st of each month at 1 AM
cron.schedule('0 1 1 * *', async () => {
  console.log('[CRON] Calculating monthly interest...')
  try { await calculateMonthlyInterest() }
  catch (err) { console.error('[CRON] calculateMonthlyInterest error:', err) }
})

// Schedule abandoned detection: 1st of each month at 6 AM (skips Jan-Mar internally)
cron.schedule('0 6 1 * *', async () => {
  console.log('[CRON] Running abandoned business detection...')
  try {
    const flagged = await detectAbandonedBusinesses()
    console.log(`[CRON] Flagged ${flagged.length} businesses as potentially abandoned`)
  }
  catch (err) { console.error('[CRON] abandonedDetection error:', err) }
})
```

### Verify `node-cron` is installed:
```bash
cd backend && npm ls node-cron
```
(Should already be installed from the prerequisite step above.)

---

## 4C-5. Post-Requirements Tracking

When a permit application is approved with conditions (post-requirements), the business owner must fulfill them within a deadline.

### New model: PostRequirement

**File:** `backend/services/business-service/src/models/PostRequirement.js` (new)

```javascript
const mongoose = require('mongoose')

const PostRequirementSchema = new mongoose.Schema({
  businessProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessProfile', required: true },
  businessId: { type: String, required: true },
  requirementDescription: { type: String, required: true },
  deadline: { type: Date, required: true },
  status: {
    type: String,
    enum: ['pending', 'submitted', 'verified', 'overdue'],
    default: 'pending',
  },
  submittedDocuments: [{
    fileName: String,
    ipfsHash: String,
    uploadedAt: { type: Date, default: Date.now },
  }],
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

PostRequirementSchema.index({ businessProfileId: 1, businessId: 1, status: 1 })

module.exports = mongoose.model('PostRequirement', PostRequirementSchema)
```

### New routes:

**File:** `backend/services/business-service/src/routes/postRequirements.js` (new)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/business/post-requirements/:businessId` | List post-requirements for a business |
| `POST` | `/api/business/post-requirements` | Create (staff only) |
| `PUT` | `/api/business/post-requirements/:id/submit` | Business owner submits documents |
| `PUT` | `/api/business/post-requirements/:id/verify` | Staff verifies submission |

### Cron: overdue checker

**File:** `backend/services/business-service/src/cron/postRequirementOverdue.js` (new)

Runs daily. Finds `PostRequirement` with `status: 'pending'` and `deadline < now`, updates to `'overdue'`, creates notification for business owner and staff.

---

## 4C-6. Wire Blockchain Audit Logging

### Current state:
`backend/services/audit-service/` has blockchain integration but business-service and admin-service don't send audit events to it.

### Target:
When critical operations happen in business-service or admin-service, send an audit event to the audit-service via internal HTTP call.

**File:** `backend/services/business-service/src/lib/auditClient.js` (new)

```javascript
const http = require('http')

const AUDIT_SERVICE_URL = process.env.AUDIT_SERVICE_URL || 'http://localhost:3004'

async function logAuditEvent(eventType, userId, entityType, entityId, metadata = {}) {
  const body = JSON.stringify({ eventType, userId, entityType, entityId, metadata, timestamp: new Date() })
  return new Promise((resolve, reject) => {
    const url = new URL(`${AUDIT_SERVICE_URL}/api/audit/log`)
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }
    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => resolve(JSON.parse(data)))
    })
    req.on('error', (err) => {
      console.error('Audit log failed (non-blocking):', err.message)
      resolve(null)
    })
    req.setTimeout(5000, () => { req.destroy(); resolve(null) })
    req.write(body)
    req.end()
  })
}

module.exports = { logAuditEvent }
```

### Events to audit:
| Event | Service | Trigger |
|---|---|---|
| `business_registered` | business-service | New business submitted |
| `business_approved` | admin-service | Permit approved |
| `business_rejected` | admin-service | Permit rejected |
| `business_retired` | business-service | Retirement confirmed |
| `permit_revoked` | business-service | Inspector/manager revokes |
| `inspection_completed` | business-service | Inspection finished |
| `violation_issued` | business-service | Violation created |
| `renewal_submitted` | business-service | Renewal started |
| `payment_recorded` | business-service | Payment made |

Each event goes to `POST /api/audit/log` and the audit-service handles blockchain anchoring.

---

## Edge Cases
- Violation query fix must handle businesses with no inspections (returns 0 violations)
- Cron jobs should be idempotent — running twice in the same period should not create duplicates
- Blockchain audit logging is fire-and-forget; failures must not block the main operation
- Post-requirement overdue cron must handle timezone correctly for Alaminos (UTC+8)

## Acceptance Criteria
1. Retirement route correctly detects open violations via Inspection model
2. Inspection model includes new fields (isSurprise, compliancePeriodEnd, etc.)
3. BusinessProfile has permitRevoked fields
4. All 3 cron jobs are scheduled and run without errors
5. PostRequirement CRUD endpoints work
6. Overdue checker cron runs daily
7. Audit events are sent from business-service on critical operations
8. All existing tests still pass

## Rollback Plan
Revert model changes, remove cron schedules from index.js, delete new files.
