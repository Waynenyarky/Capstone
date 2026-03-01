# Phase 5: SOLID Principles Refactoring

## Overview
Split god-object services into focused modules, extract business logic from route handlers, standardize error handling, and reduce cross-service coupling. This phase refactors without changing behavior.

## Prerequisites
All feature phases (0-4F) must be complete and tests passing before refactoring.

---

## 5-1. Split BusinessProfileService (1,847 lines → 5 services)

**File:** `backend/services/business-service/src/services/businessProfileService.js`

### Current: 30+ methods covering 5 domains

### Target split:

#### A. ProfileService (profile CRUD)
**File:** `backend/services/business-service/src/services/profileService.js` (new)

Methods to move:
- `getProfile`
- `updateStep` (owner identity, consent)
- `confirmRequirementsChecklist`
- `markRequirementsPdfDownloaded`

#### B. BusinessService (business CRUD)
**File:** `backend/services/business-service/src/services/businessService.js` (new)

Methods to move:
- `addBusiness`
- `updateBusiness`
- `deleteBusiness`
- `getBusinesses`
- `getBusiness`
- `setPrimaryBusiness`
- `updateBusinessStatus`
- `updateBusinessRiskProfile`
- `submitBusinessApplication`
- `getBusinessApplicationStatus`
- `updateLGUDocuments`
- `updateBIRRegistration`
- `updateOtherAgencyRegistrations`

#### C. RenewalService
**File:** `backend/services/business-service/src/services/renewalService.js` (new)

Methods to move:
- `getGrossReceiptsCalendarYear`
- `migrateGrossReceiptsIfNeeded`
- `getRenewalPeriod`
- `startRenewal`
- `acknowledgeRenewalPeriod`
- `updateGrossReceipts`
- `uploadRenewalDocuments`
- `calculateRenewalAssessment`
- `processRenewalPayment`
- `submitRenewal`
- `getRenewalStatus`

#### D. ValidationService
**File:** `backend/services/business-service/src/services/validationService.js` (new)

Methods to move:
- `validateRegistration`
- `determineJurisdiction`
- `determineInspections`
- `assessRisk`

#### E. Backward-Compatible Facade
**File:** `backend/services/business-service/src/services/businessProfileService.js` (keep as thin facade)

```javascript
const profileService = require('./profileService')
const businessService = require('./businessService')
const renewalService = require('./renewalService')
const validationService = require('./validationService')

module.exports = {
  // Profile
  getProfile: profileService.getProfile,
  updateStep: profileService.updateStep,
  // Business
  addBusiness: businessService.addBusiness,
  updateBusiness: businessService.updateBusiness,
  // ... etc. (re-export all methods)
}
```

This keeps all existing `require('./businessProfileService')` calls working without changes.

---

## 5-2. Split PermitApplicationService (849 lines → 3 modules)

**File:** `backend/services/admin-service/src/services/permitApplicationService.js`

### Target split:

#### A. ApplicationQueryService
**File:** `backend/services/admin-service/src/services/applicationQueryService.js` (new)

- `getApplications` (with filters, pagination)
- `getApplicationById` (with document URLs, owner merge)
- `buildApplicationHistory`

#### B. ApplicationReviewService
**File:** `backend/services/admin-service/src/services/applicationReviewService.js` (new)

- `startReview`
- `reviewApplication`
- `updateFieldDecisions`
- `updateLobFormData`

#### C. PermitEmailService
**File:** `backend/services/admin-service/src/services/permitEmailService.js` (new)

- `sendPermitDecisionNotification` (email templates)

#### D. Backward-Compatible Facade
Same pattern as above — keep `permitApplicationService.js` as a re-exporting facade.

---

## 5-3. Extract Business Logic from retirement.js

**File:** `backend/services/business-service/src/routes/retirement.js` (194 lines)

### Create RetirementService:
**File:** `backend/services/business-service/src/services/retirementService.js` (new)

```javascript
class RetirementService {
  async requestRetirement(userId, businessId, reason) {
    // Validate no open violations (using the fixed query from Phase 4C)
    // Set retirementStatus to 'requested'
    // Create notification
    // Return updated business
  }

  async verifyRetirement(inspectorId, businessId, verified) {
    // Inspector marks as verified or rejected
  }

  async confirmRetirement(managerId, businessId) {
    // Manager confirms final retirement
  }

  async listRetirements(filters) {
    // Aggregation query for retirement list
  }
}
```

### Slim down routes:
```javascript
router.post('/:businessId/retire', requireAuth, async (req, res) => {
  try {
    const result = await retirementService.requestRetirement(req.user._id, req.params.businessId, req.body.reason)
    return respond.success(res, 200, result)
  } catch (err) {
    return respond.error(res, err.statusCode || 500, err.code || 'retirement_error', err.message)
  }
})
```

---

## 5-4. Extract Business Logic from login.js

**File:** `backend/services/auth-service/src/routes/login.js` (812 lines)

### Create LoginService:
**File:** `backend/services/auth-service/src/services/loginService.js` (new)

```javascript
class LoginService {
  async startLogin(email, password, captchaToken, remoteIp) {
    // CAPTCHA verification
    // User lookup
    // Lockout check
    // Password verification
    // MFA determination
    // OTP generation and sending
    // Return { requiresMfa, sessionData }
  }

  async verifyOtp(email, code) {
    // OTP verification
    // Session creation
    // Return { token, user }
  }

  async verifyTotp(email, code) {
    // TOTP verification
    // Session creation
  }
}
```

### Result:
`login.js` route handlers shrink to ~20 lines each, delegating to `LoginService`.

---

## 5-5. Standardize Error Handling

### Problem:
Three different error response patterns across services.

### Solution — Shared error utility:

**File:** `backend/shared/lib/respond.js` (new — create `backend/shared/lib/` directory first)

```javascript
function success(res, status, data, message) {
  return res.status(status).json({ success: true, data, message })
}

function error(res, status, code, message, details = null) {
  return res.status(status).json({
    success: false,
    error: { code, message, ...(details ? { details } : {}) },
  })
}

module.exports = { success, error }
```

### Migration plan:
1. Create the shared respond utility
2. Update each service's `middleware/respond.js` to re-export from shared (backward compatible)
3. Gradually update routes that use raw `res.status().json()` to use `respond`:
   - `retirement.js` — uses `res.status().json({ error: { code, message } })`
   - `appeals.js` — same pattern
   - `payments.js` — same pattern
   - `postRequirements.js` — same pattern
   - `generalPermitConfig.js` — uses `res.status().json({ error: 'string' })`

### Priority: High for consistency but LOW risk since the client checks for `error` in either format.

---

## 5-6. Reduce Cross-Service Model Coupling

### Problem:
- `businessProfileService.js` imports `auth-service/src/models/User` and `Role` directly
- `admin-service/lib/notificationService.js` imports `auth-service` models
- This creates deployment coupling and circular dependencies

### Solution:
Replace cross-service model imports with HTTP calls:

```javascript
// BEFORE (tight coupling):
const User = require('../../../auth-service/src/models/User')
const user = await User.findById(userId).lean()

// AFTER (loose coupling via HTTP):
const authClient = require('../lib/authClient')
const user = await authClient.getUser(userId)
```

**File:** `backend/services/business-service/src/lib/authClient.js` (new)

```javascript
async function getUser(userId) {
  const res = await fetch(`${process.env.AUTH_SERVICE_URL}/api/internal/users/${userId}`)
  if (!res.ok) return null
  const data = await res.json()
  return data.data
}

async function getUsersByRole(roleSlug) {
  const res = await fetch(`${process.env.AUTH_SERVICE_URL}/api/internal/users?role=${roleSlug}`)
  if (!res.ok) return []
  const data = await res.json()
  return data.data
}

module.exports = { getUser, getUsersByRole }
```

**File:** `backend/services/auth-service/src/routes/internal.js` (new)

```javascript
// Internal endpoints (validated by INTERNAL_SERVICE_KEY)
router.get('/users/:id', requireInternalKey, async (req, res) => {
  const user = await User.findById(req.params.id).select('-passwordHash').lean()
  return respond.success(res, 200, user)
})

router.get('/users', requireInternalKey, async (req, res) => {
  const filter = {}
  if (req.query.role) {
    const role = await Role.findOne({ slug: req.query.role })
    if (role) filter.role = role._id
  }
  const users = await User.find(filter).select('-passwordHash').lean()
  return respond.success(res, 200, users)
})
```

### Migration order:
1. Create internal auth endpoints
2. Create `authClient` in business-service and admin-service
3. Replace direct model imports one at a time
4. Remove cross-service model `require` statements

---

## 5-7. Fix Notification Service Inconsistency

### Problem:
`permitApplicationService.js` has two different require paths for notification:
- `require('../../../src/services/notificationService')` (broken path, fixed in Phase 0)
- `require('./notificationService')` (local)

### Solution:
After the Phase 0 path fix, ensure all notification calls within admin-service use:
```javascript
const { createNotification } = require('./notificationService')
```

And all notification calls include the SSE cross-service push (from Phase 4D).

---

## Refactoring Rules
1. **No behavior changes** — every refactored function must produce identical output
2. **One service at a time** — split, test, commit, then move to the next
3. **Facade pattern** — keep backward-compatible re-exports so nothing breaks
4. **Run tests after each split** — `npm test` must pass at every step

## Acceptance Criteria
1. `businessProfileService.js` is split into 4 focused services + 1 facade
2. `permitApplicationService.js` is split into 3 modules + 1 facade
3. `retirement.js` routes delegate to `RetirementService`
4. `login.js` routes delegate to `LoginService`
5. Error handling uses consistent `respond` utility across all services
6. No cross-service model imports remain (all via HTTP internal endpoints)
7. All existing tests pass without modification
8. All services start without errors

## Rollback Plan
Each split is independently revertable since the facade preserves the original interface. If any split breaks tests, revert that split only.
