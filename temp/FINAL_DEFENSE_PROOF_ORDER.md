# BizClear Final Defense — Proof Order Guide

> This guide reorders evidence from `temp/FINAL_DEFENSE_RUBRICS_PROOF.md` into a **presentation-first sequence** (what is easiest to prove live first), instead of strict rubric order.

---

## Why this order

You do **not** need to start with password hash internals. Start with what the panel can immediately see:
1. Authentication flow works
2. MFA is enforced
3. Sessions/tokens are protected
4. Authorization boundaries are enforced
5. Input/security controls block attacks
6. Then show deeper internals (hashing, encryption, blockchain, AI)

---

## Recommended Presentation Flow (In Order)

## 1) Authentication Works (Visible, Fast Win)

### Show live
- Login flow for a valid user
- Invalid credentials returns safe generic error
- Successful login returns access and role context

### Say
- "We implemented secure authentication with JWT, role claims, and audit logging."
- "No user-enumeration leakage in login errors."

### Pull proof from
- `temp/FINAL_DEFENSE_RUBRICS_PROOF.md` → **1.1 Authentication**
- `backend/services/auth-service/src/routes/login.js`
- `backend/services/auth-service/src/middleware/auth.js`

---

## 2) MFA Enforcement (Strongest Security Demo)

### Show live
- Staff/admin login requiring MFA setup/verification
- TOTP verification success
- Optional: replayed TOTP rejected (`totp_replayed`)

### Say
- "MFA is enforced for privileged roles (staff/admin)."
- "We support TOTP and passkeys (WebAuthn), with replay prevention."

### Pull proof from
- `temp/FINAL_DEFENSE_RUBRICS_PROOF.md` → **1.1.3 MFA**
- `backend/services/auth-service/src/routes/mfa.js`
- `backend/services/auth-service/src/routes/webauthn.js`
- `backend/services/auth-service/src/lib/secretCipher.js`

---

## 3) Session + Token Security (Practical Risk Control)

### Show live
- Session invalidation (logout or invalidate-all)
- Old token fails after invalidation (`token_invalidated`)
- Short timeout behavior for admin

### Say
- "Token versioning and session tracking ensure old tokens are revoked."
- "Admin sessions use stricter timeout controls."

### Pull proof from
- `temp/FINAL_DEFENSE_RUBRICS_PROOF.md` → **1.1.2, 1.1.4, 1.1.5**
- `backend/services/auth-service/src/routes/logout.js`
- `backend/services/auth-service/src/models/Session.js`
- `backend/services/auth-service/src/middleware/auth.js`

---

## 4) Authorization Boundaries (Role Separation)

### Show live
- Admin endpoint with admin token → success
- Same endpoint with non-admin token → 403 forbidden

### Say
- "RBAC is enforced at middleware and route level."
- "Sensitive admin actions require step-up authentication."

### Pull proof from
- `temp/FINAL_DEFENSE_RUBRICS_PROOF.md` → Authentication/Authorization sections
- `backend/services/*/src/middleware/auth.js` (`requireRole`, `requireAdminStepUp`)

---

## 5) Input Validation + Attack Blocking (Great for Panel Q&A)

### Show live
- SQLi-like input rejected
- XSS payload sanitized/rejected
- CSRF-protected route fails without token
- Rate limit/account lockout behavior

### Say
- "Validation is server-side (Joi), plus sanitizer checks for SQLi/XSS."
- "CSRF and rate limiting are enabled as defense-in-depth controls."

### Pull proof from
- `temp/FINAL_DEFENSE_RUBRICS_PROOF.md` → **1.2 Input Validation**
- `backend/services/auth-service/src/middleware/validation.js`
- `backend/services/auth-service/src/lib/sanitizer.js`
- `backend/shared/csrf.js`
- `backend/services/auth-service/src/middleware/rateLimit.js`
- `backend/services/auth-service/src/lib/accountLockout.js`

---

## 6) Strong Password Hashing (Now show internals)

### Show live
- Explain hash format in DB (`$2b$10$...`)
- Mention salt rounds and compare flow

### Say
- "Passwords are never stored plaintext; bcrypt with 10 salt rounds is used."
- "Password history and expiration policies are enforced."

### Pull proof from
- `temp/FINAL_DEFENSE_RUBRICS_PROOF.md` → **1.1.1 Strong Password Hashing**
- `backend/services/auth-service/src/routes/login.js`
- `backend/services/auth-service/src/models/User.js`

---

## 7) Database Encryption + Audit Integrity

### Show live
- Sensitive fields appear encrypted in DB (`enc:v2:` / `det:v2:`)
- Audit log hash flow explanation (SHA-256 + anchored hash)

### Say
- "We implemented field-level AES-256-GCM encryption and tamper-evident audit logging."

### Pull proof from
- `temp/FINAL_DEFENSE_RUBRICS_PROOF.md` security/database/audit sections
- `backend/shared/lib/fieldCipher.js`
- `backend/shared/lib/encryptionPlugin.js`
- `backend/services/auth-service/src/lib/auditLogger.js`

---

## 8) Blockchain Security + Gas Feasibility

### Show live
- Role-protected smart contract calls
- `verifyHash` O(1) explanation
- Cost reduction numbers (87.4%)

### Say
- "Blockchain is used for immutable audit anchoring with feasible operating cost."

### Pull proof from
- `temp/FINAL_DEFENSE_RUBRICS_PROOF.md` blockchain sections
- `blockchain/contracts/AccessControl.sol`
- `blockchain/contracts/AuditLog.sol`
- `blockchain/test/AuditLog.test.js`

---

## 9) AI Model Quality + Security

### Show live
- Prediction examples (English + Filipino)
- Confidence gating behavior
- Mention key metrics

### Say
- "Model is high-accuracy and secure-by-design (input checks + admin-protected retraining)."

### Pull proof from
- `temp/FINAL_DEFENSE_RUBRICS_PROOF.md` AI sections
- `ai/service/predict_app.py`
- `ai/models/evaluation_metrics.json`
- `ai/models/training_meta.json`

---

## 10) Documentation & Closing Evidence

### Show live
- `docs/` now clean and checklist-focused
- Point to rubrics proof + IAS2 checklist docs

### Say
- "All rubric claims are mapped to implementation files and test evidence."

### Pull proof from
- `temp/FINAL_DEFENSE_RUBRICS_PROOF.md`
- `temp/IAS2_SYSTEM_SECURITY_CHECKLIST.md`
- `docs/README.md`, `docs/SECURITY.md`, `docs/API.md`, `docs/DEPLOYMENT.md`, `docs/TROUBLESHOOTING.md`, `docs/MAINTENANCE.md`

---

## Quick 12-Minute Defense Script (Optional)

1. Authentication demo (1.5 min)
2. MFA enforcement demo (2 min)
3. Session invalidation + role boundary demo (2 min)
4. Input validation/security controls demo (2 min)
5. Password hashing + encryption internals (1 min)
6. Blockchain integrity + gas cost numbers (1.5 min)
7. AI quality and training explanation (1.5 min)
8. Documentation/evidence map close (0.5 min)

---

## Backup Order (if panel asks "start with cryptography")

1. Password hashing
2. Database encryption
3. MFA
4. JWT/session invalidation
5. Authorization
6. Input validation/CSRF/rate limiting
7. Blockchain tamper-evidence
8. AI and docs

This gives you a second narrative depending on professor preference.
