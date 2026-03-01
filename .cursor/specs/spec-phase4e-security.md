# Phase 4E: Security Fixes

## Overview
Fix authentication bugs, gate dev backdoors, expand CAPTCHA coverage, add CSP headers, and harden admin operations.

## Prerequisites
Phase 0, 1 complete.

---

## 4E-1. Fix signup.js Missing Imports

**File:** `backend/services/auth-service/src/routes/signup.js`

### Bug:
`path` and `fs` are used in error logging (lines 93 and 309) but never imported. If these error handlers trigger, they throw `ReferenceError: path is not defined`.

### Fix:
Add to the top of the file (after line 1):
```javascript
const path = require('path')
const fs = require('fs')
```

---

## 4E-2. Add Password Strength Check to Direct Signup Route

**File:** `backend/services/auth-service/src/routes/signup.js`

### Current state:
The `validatePasswordStrengthMiddleware` function exists (line 207) but is only used on `/signup/start` (line 230). The legacy `POST /signup` route (line 128) has NO password strength validation.

### Fix:
Add `validatePasswordStrengthMiddleware` to the direct signup route:

```javascript
// BEFORE (line ~128):
router.post('/signup', validateBody(signupPayloadSchema), async (req, res) => {

// AFTER:
router.post('/signup', validatePasswordStrengthMiddleware, validateBody(signupPayloadSchema), async (req, res) => {
```

---

## 4E-3. Fix resetKey() No-op

**File:** `backend/services/auth-service/src/routes/signup.js`

### Bug:
Lines 294-297 and 351-354 call `signupVerifyLimiter.resetKey(emailKey)` but `perEmailRateLimit` (from `express-rate-limit`) does not expose a `resetKey` method. The conditional check `if (signupVerifyLimiter.resetKey)` prevents crashes, but the rate limit is never actually reset when a new code is generated.

### Fix (two options):
**Option A — Use the store's resetKey:**
```javascript
// express-rate-limit v7+ exposes store.resetKey
if (signupVerifyLimiter.options?.store?.resetKey) {
  await signupVerifyLimiter.options.store.resetKey(emailKey)
}
```

**Option B — Accept the no-op:**
Rate limits resetting on code regeneration is a nice-to-have. If using the default MemoryStore, `resetKey` IS available on v7+. Verify the installed version:
```bash
cd backend && npm ls express-rate-limit
```
If >=7.0.0, the store method works. Otherwise, leave a comment explaining the limitation.

---

## 4E-4. Gate Dev Backdoors Behind NODE_ENV

**File:** `backend/services/auth-service/src/routes/login.js`

### Backdoor 1: Email '1' shorthand (lines 38-41)
```javascript
// BEFORE:
function isEmailIdentifier(identifier) {
  if (identifier === '1') return true
  return identifier.includes('@')
}

// AFTER:
function isEmailIdentifier(identifier) {
  if (process.env.NODE_ENV === 'development' && identifier === '1') return true
  return identifier.includes('@')
}
```

### Backdoor 2: Relaxed Joi validation for '1' (lines 54-62)
```javascript
// BEFORE:
email: Joi.string().trim().min(1).max(200).required(),
password: Joi.string()
  .max(200)
  .when('email', { is: '1', then: Joi.string().min(1), otherwise: Joi.string().min(6) })
  .required(),

// AFTER:
email: Joi.string().trim().min(1).max(200).required(),
password: Joi.string()
  .max(200)
  .when('email', {
    is: '1',
    then: process.env.NODE_ENV === 'development'
      ? Joi.string().min(1)
      : Joi.string().min(6),
    otherwise: Joi.string().min(6),
  })
  .required(),
```

### Backdoor 3: resendCodeSchema '1' (line 89-91)
```javascript
// BEFORE:
email: Joi.alternatives().try(Joi.string().email(), Joi.string().valid('1')).required(),

// AFTER:
email: process.env.NODE_ENV === 'development'
  ? Joi.alternatives().try(Joi.string().email(), Joi.string().valid('1')).required()
  : Joi.string().email().required(),
```

### Backdoor 4: Auto-create admin on '1' login (lines 164-181)
```javascript
// Wrap the entire block:
if (process.env.NODE_ENV === 'development' && String(identifier) === '1') {
  // ... existing admin seed logic ...
}
```

### Backdoor 5: BYPASS_MFA_DEV (lines 263-274)
This is already gated with `process.env.NODE_ENV !== 'production'`. Tighten to development only:
```javascript
// BEFORE:
const bypassMfaDev = process.env.BYPASS_MFA_DEV === 'true' && process.env.NODE_ENV !== 'production'

// AFTER:
const bypassMfaDev = process.env.BYPASS_MFA_DEV === 'true' && process.env.NODE_ENV === 'development'
```

### Backdoor 6: Hardcoded LGU Officer OTP '123456' (lines 295-297)
```javascript
// BEFORE:
const isLguOfficer = doc.role && doc.role.slug === 'lgu_officer'
const code = isLguOfficer ? '123456' : generateCode()

// AFTER:
const code = generateCode()
```
Remove the hardcoded OTP entirely. LGU officers should receive real OTPs via email/SMS like everyone else.

---

## 4E-5. Add CAPTCHA to Forgot-Password Route

**File:** `backend/services/auth-service/src/routes/passwordReset.js`

### Current state:
Turnstile is only on `/signup/start`, `/login/start`, `/login/resend`. The forgot-password endpoint is unprotected from bot abuse.

### Fix:
Add CAPTCHA check to the forgot-password initiation route:
```javascript
const { verifyTurnstileToken, isCaptchaEnabled } = require('../lib/turnstile')

// In the POST handler, before processing:
if (isCaptchaEnabled()) {
  const captchaResult = await verifyTurnstileToken(req.body.captchaToken, req.ip)
  if (!captchaResult.success) {
    return respond.error(res, 400, 'captcha_failed', 'CAPTCHA verification failed')
  }
}
```

Also update the web form (`web/src/features/authentication/components/ForgotPasswordForm.jsx` or wherever it is) to include the Turnstile widget if CAPTCHA is enabled.

---

## 4E-6. Add CSP Headers via Helmet

### Install:
```bash
cd backend && npm install helmet
```

### Apply to each service's `index.js`:

**Files:**
- `backend/services/auth-service/src/index.js`
- `backend/services/admin-service/src/index.js`
- `backend/services/business-service/src/index.js`
- `backend/services/audit-service/src/index.js`

Add near the top (after express init):
```javascript
const helmet = require('helmet')

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://challenges.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:5173'],
      frameSrc: ["https://challenges.cloudflare.com"],
      fontSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}))
```

Note: `crossOriginEmbedderPolicy: false` is needed if serving images/IPFS content cross-origin.

---

## 4E-7. Harden Admin Step-Up for Temporary Credentials

**File:** `backend/services/admin-service/src/routes/tamperIncidents.js` (or wherever temporary credentials are issued)

### Current state:
The `mfaStepUpVerify.js` module only covers MFA disable/undo. When an admin issues temporary credentials for account recovery, there is no step-up verification.

### Fix:
1. Extend `mfaStepUpVerify.js` with a new pair:
```javascript
const issueCredVerified = new Map()

module.exports = {
  // ... existing exports ...
  setIssueCredVerified: (userId) => set(issueCredVerified, userId),
  consumeIssueCredVerified: (userId) => getAndDelete(issueCredVerified, userId),
}
```

2. In the route that issues temporary credentials, require passkey verification first:
```javascript
if (!consumeIssueCredVerified(req.user._id)) {
  return respond.error(res, 403, 'step_up_required', 'Passkey verification required')
}
```

---

## 4E-8. Gate Mobile Dev Backdoor

**File:** `mobile/app/lib/presentation/screens/login_page.dart`

### Current state (line ~259):
```dart
final isDevAdmin = v == '1';
if (!looksEmail && !isDevAdmin) {
  return 'Enter a valid email';
}
```

### Fix:
```dart
// Remove the isDevAdmin bypass entirely, or gate behind kDebugMode:
import 'package:flutter/foundation.dart';

final isDevAdmin = kDebugMode && v == '1';
if (!looksEmail && !isDevAdmin) {
  return 'Enter a valid email';
}
```

---

## Edge Cases
- CAPTCHA changes need frontend coordination (Turnstile widget on forgot-password form)
- Helmet CSP may need tuning for IPFS URLs, CDN fonts, etc. — test in dev first
- Removing hardcoded OTP for LGU officers requires confirming they have valid emails in the DB for OTP delivery

## Acceptance Criteria
1. `signup.js` no longer crashes on error logging — `path` and `fs` imported
2. Direct `/signup` route validates password strength
3. All dev backdoors require `NODE_ENV=development` or `kDebugMode`
4. LGU officer OTP is randomly generated
5. Forgot-password has CAPTCHA protection
6. All 4 backend services respond with CSP headers
7. Admin temporary credential issuance requires passkey step-up
8. Mobile login rejects `'1'` in production builds
9. All existing tests still pass

## Rollback Plan
Revert individual files. Helmet can be uninstalled with `npm uninstall helmet`.
