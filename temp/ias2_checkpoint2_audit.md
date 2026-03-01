# IAS 2 System Security Checkpoint – Implementation Audit

This document maps each item on the **ITE 370 – IAS 2 SYSTEM SECURITY CHECKPOINT FORM** (Pages 5–8) to the Capstone codebase: **implemented** (with file and line references) or **not implemented**.

---

## Category 1: Authentication

### Password Storage — **Implemented** ✓  
**Target:** bcrypt/Argon2 or bcrypt + salt/pepper  

- **bcrypt hashing (salt rounds 10):**  
  - `backend/services/auth-service/src/routes/login.js` — line 205: `bcrypt.compare(password, doc.passwordHash)`; line 213: `bcrypt.hash(password, 10)`  
  - `backend/services/auth-service/src/routes/signup.js` — line 143: `bcrypt.hash(password, 10)`  
  - `backend/services/auth-service/src/routes/passwordReset.js` — line 338: `bcrypt.hash(password, 10)`  
  - `backend/services/auth-service/src/routes/profilePassword.js` — lines 56, 76, 272: `bcrypt.compare` / `bcrypt.hash(..., 10)`  
  - `backend/services/auth-service/src/routes/profileFirstLogin.js` — lines 36, 53: `bcrypt.compare` / `bcrypt.hash(String(newPassword), 10)`  
  - Comment in login: *REQUIREMENT IAS-1.1: strong password hashing (bcrypt)*  

---

### Session Management — **Implemented** ✓  
**Target:** Expiry + secure flags  

- **Session expiry:**  
  - `backend/services/auth-service/src/middleware/auth.js` — line 5: `const ttlMin = Number(process.env.ACCESS_TOKEN_TTL_MINUTES) || 60`; lines 6–7: `expSec = nowSec + Math.max(1, ttlMin) * 60` (JWT expiry).  
  - `backend/services/auth-service/src/models/Session.js` — line 71: "Method to check if session is expired"; session model has `expiresAt`.  
  - `backend/services/auth-service/src/routes/session.js` — lines 72, 101–103: `expiresAt`, `isExpired` returned to client.  
- **Secure cookie / SameSite:**  
  - `backend/services/auth-service/src/index.js` — line 72: `cookie: { secure: process.env.NODE_ENV === 'production', sameSite: 'lax' }`.  
  - `backend/services/auth-service/src/lib/csrf.js` — lines 59–61, 66–67, 72–75: `secure`, `sameSite`, `maxAge` for CSRF cookie.  

---

### Error Handling (login) — **Implemented** ✓  
**Target:** Generic + logs (no info leakage)  

- **Generic login error message:**  
  - `backend/services/auth-service/src/routes/login.js` — lines 189, 231: `respond.error(res, 401, 'invalid_credentials', 'Invalid email or password')` with comment *REQUIREMENT IAS-1.3: generic login errors*.  
- **User-friendly mapping / no leakage:**  
  - `backend/services/auth-service/src/lib/errorHandler.js` — line 87: "Prevents information leakage while providing helpful messages"; `getUserFriendlyMessage()` maps codes to safe messages.  
  - `web/src/lib/http.js` — line 306: `'invalid_credentials': 'The email address or password you entered is incorrect...'`; lines 350–365: login endpoints use generic invalid-credentials handling.  

---

### Brute Force Protection — **Implemented (Rate limit)** ✓ / **CAPTCHA not implemented** ✗  
**Target:** Rate limit = implemented; Rate + CAPTCHA = not present  

- **Rate limiting on login/signup/verify:**  
  - `backend/services/auth-service/src/routes/login.js` — lines 16, 92–111: `perEmailRateLimit`, `login_code_rate_limited`, `login_verify_rate_limited`.  
  - `backend/services/auth-service/src/middleware/rateLimit.js` — full file: `express-rate-limit`, verification/profile/password/admin/audit limits; lines 41, 115–122: 429 and `rate_limit_exceeded`.  
  - `backend/services/auth-service/src/lib/accountLockout.js` (referenced from login): failed-attempt tracking and lockout.  
- **CAPTCHA:** No `captcha`, `recaptcha`, `hcaptcha`, or `turnstile` in repo → **not implemented**.  

---

### MFA / 2FA — **Implemented** ✓  
**Target:** Optional / Mandatory (admin)  

- **TOTP (authenticator):**  
  - `backend/services/auth-service/src/lib/verificationService.js` — lines 45–50, 142–185: MFA verification with TOTP, `verifyTotpWithCounter`, `mfaLastUsedTotpCounter`.  
  - `backend/services/auth-service/src/routes/mfa.js`, `mfaBootstrap.js` — MFA setup/verify endpoints.  
- **WebAuthn / passkeys:**  
  - `backend/services/auth-service/src/routes/webauthn.js` — registration and authentication; lines 503, 653+: staff/admin MFA and step-up.  
  - `web/src/features/authentication/hooks/useLoginFlow.js` — lines 76–88: passkey as second factor; `mfaRequired`, TOTP step.  
- **Staff/admin forced MFA setup:**  
  - `backend/services/auth-service/src/routes/staffRecovery.js` — lines 280–282, 458–460, 518–527: `mustSetupMfa = true` after recovery; "You must change your password and set up MFA."  

**Evidence (files/lines):**  
- Auth MFA routes: `backend/services/auth-service/src/routes/index.js` — lines 18–20, 50–52: `mfaRouter`, `mfaBootstrapRouter`, `webauthnRouter`.  
- Mobile MFA: `mobile/app/lib/presentation/screens/security/mfa_settings_screen.dart` (e.g. lines 5–9, 45–52, 254–262).  

---

### Token Security — **Implemented** ✓  
**Target:** Short-lived + refresh (or validated JWT)  

- **Short-lived JWT:**  
  - `backend/services/auth-service/src/middleware/auth.js` — lines 5–7, 14–16: `ACCESS_TOKEN_TTL_MINUTES` (default 60), `expSec`, `jwt.sign(payload, secret)`; line 43: `jwt.verify(token, secret)` with comment *REQUIREMENT IAS-1.6: validated tokens (JWT)*.  
  - Step-up token: lines 20–33: `signStepUpToken`, 5-minute TTL.  
- **Token version invalidation:**  
  - Same file, lines 44–55: `tokenVersion` checked against user's `tokenVersion`; 401 `token_invalidated` if mismatch.  
- **Refresh behavior (client):**  
  - `web/src/features/authentication/hooks/useAuthSession.js` — lines 103, 127: "token needs refresh (expiring soon)", "validate it" (re-validation, not a separate refresh token endpoint).  

---

### Password Policy — **Implemented** ✓  
**Target:** Length + complexity + expiration  

- **Length + complexity:**  
  - `backend/services/auth-service/src/lib/passwordValidator.js` — lines 11–51: `validatePasswordStrength` (12+ chars, upper, lower, number, special, max 200); comment *REQUIREMENT IAS-1.7: strong password policy*.  
  - Used in signup, profile password, monolith profile (e.g. `backend/src/routes/auth/profile.js` — lines 352, 474, 548).  
- **Expiration (90-day):**  
  - `backend/services/auth-service/src/lib/passwordExpiry.js` — lines 2–6, 10–19, 24–34: `PASSWORD_EXPIRY_DAYS = 90`, `isPasswordExpired`, `isPasswordExpiredByPolicy`.  
  - `backend/services/auth-service/src/routes/login.js` — lines 672–676, 812, 818: `passwordExpiredByPolicy`, `mustChangeCredentials` when expired.  
  - `backend/services/auth-service/src/routes/profileCore.js` — lines 12, 38, 74, 96, 119: `isPasswordExpiredByPolicy`, `passwordExpired` in response.  

---

### Logout / Inactivity — **Implemented** ✓  
**Target:** Invalidate + auto timeout  

- **Logout invalidates session:**  
  - `backend/services/auth-service/src/routes/session.js` — lines 113–119, 135, 154–156: `POST /session/invalidate` (single session), comment *REQUIREMENT IAS-1.8: logout invalidates session*; lines 163–205: `POST /session/invalidate-all`.  
  - `backend/services/auth-service/src/routes/logout.js` — lines 7–17: `POST /logout` with `requireJwt`, in-app notification.  
  - `backend/services/auth-service/src/models/Session.js` — lines 52, 85–88: `invalidatedAt`, `invalidate(reason)`.  
- **Token version invalidation (e.g. password change):**  
  - `backend/services/auth-service/src/routes/passwordReset.js` — line 343: "invalidate sessions"; profile password and monolith profile increment `tokenVersion` and issue new token (e.g. `profilePassword.js` line 345, `backend/src/routes/auth/profile.js` line 637).  
- **Auto timeout (inactivity):**  
  - `web/src/features/authentication/hooks/useSessionTimeout.js` — lines 5–7: `useSessionTimeout({ timeoutMs, warningMs, onTimeout, onWarning })`.  
  - `web/src/features/authentication/components/SessionTimeoutWarning.jsx` — line 15: "Your session is about to expire due to inactivity."  
  - `backend/services/auth-service/src/routes/session.js` — line 20: "Get session timeout duration based on user role"; `backend/services/auth-service/src/routes/login.js` — lines 723, 830: session timeout by role.  
  - Mobile: `mobile/app/lib/presentation/widgets/session_timeout_manager.dart` (e.g. line 315: "paused your session due to inactivity").  

---

### Extra Credit – Advanced Authentication — **Implemented (Hardware/passkeys)** ✓  
**Target:** OAuth/SSO, Biometrics, Hardware/passkeys  

- **Hardware/passkeys (WebAuthn):**  
  - `backend/services/auth-service/src/routes/webauthn.js` — full WebAuthn registration and authentication; `@simplewebauthn/server`; passkey as second factor.  
  - `web/src/features/user/pages/profileSettings/constants.js` — line 31: "passkey is part of MFA setup"; `web/src/features/user/hooks/usePasskeyStatus.js` — passkey status.  
- **OAuth/SSO:** Login has optional Google ID token handling (`google-auth-library`, `googleLoginSchema` in `backend/services/auth-service/src/routes/login.js`); not fully wired as primary SSO.  
- **Biometrics:** Mobile may use platform biometrics for local auth; no server-side biometric verification in backend.  

**Cited as implemented:** WebAuthn/passkeys (backend webauthn routes, web PasskeyManager/usePasskeyStatus, mobile MFA flows).  

---

## Category 2: Input Validation

### Server Validation — **Implemented** ✓  
**Target:** All + Sanitization  

- **Joi schemas on API bodies:**  
  - Used across auth, business, admin (e.g. `validateBody(schema)` in auth-service routes).  
  - Example: `backend/services/auth-service/src/routes/login.js` — lines 52–59 (loginCredentialsSchema), 62–70 (verifyCodeSchema), etc.  
- **Sanitization:**  
  - `backend/services/auth-service/src/lib/sanitizer.js` — `sanitizeString`, `sanitizeEmail`, `sanitizePhoneNumber`, `sanitizeName`, `sanitizeIdNumber`, `sanitizeObject` (lines 11–197); `containsSqlInjection`, `containsXss` (77–121).  
  - Profile routes use sanitizers: e.g. `profileBusinessOwner.js` — lines 8, 113–126, 159–201, 439–448; `profileEmail.js` — lines 12, 291, 335; `profileAdmin.js` — lines 15, 393–403, 526–567; `backend/src/routes/auth/profile.js` — lines 22, 332–333, 1411, 1733–1743, 1903, 2356, 2438–2448, 2575.  

---

### SQL Injection — **Implemented (ORM + validation)** ✓  
**Target:** Parameterized / ORM  

- **MongoDB (NoSQL) + Mongoose:** No raw SQL; all DB access via Mongoose models (e.g. `User.findOne`, `AuditLog.find`).  
- **SQL pattern detection (defense in depth):**  
  - `backend/services/auth-service/src/lib/sanitizer.js` — lines 77–97: `containsSqlInjection` used in profile/business owner validation (e.g. `profileBusinessOwner.js` Joi custom `sanitizeString` that checks XSS; SQL patterns in sanitizer).  

---

### XSS — **Implemented (context-aware + sanitize)** ✓ / **CSP** ✗  
**Target:** CSP + sanitize = partial (sanitize yes; CSP not set in app)  

- **Sanitization and XSS detection:**  
  - `backend/services/auth-service/src/lib/sanitizer.js` — lines 11–27 (strip script/on*), 105–121 (`containsXss`), 129–145 (`sanitizeName`).  
  - `backend/services/auth-service/src/routes/profileBusinessOwner.js` — lines 113–116, 132: `containsXss(value)` → `helpers.error('string.xss')`; "Invalid input: XSS attempt detected".  
  - `backend/services/audit-service/src/lib/sanitizer.js` — XSS patterns and sanitizers (lines 11–27, 110–121).  
- **CSP:** ZAP report and repo grep show "Content-Security-Policy (CSP) Header Not Set" — **CSP not implemented** in app (would be set at server/gateway).  

---

### File Upload — **Implemented (type + size + content)** ✓ / **Scanning (AV/malware)** ✗  
**Target:** Type + size = yes; + scanning = no  

- **Type + size + magic bytes:**  
  - `backend/services/auth-service/src/lib/fileValidator.js` — lines 9–20 (allowed MIME/types, MAX_FILE_SIZE 5MB), 29–88 (`validateImageFile`: size, MIME, extension, `validateFileContent` magic bytes for JPEG/PNG/PDF).  
  - `backend/services/admin-service/src/lib/fileValidator.js` — lines 3–38: `validateMagicBytes` for PDF/Office types.  
- **Form definitions:**  
  - `backend/services/admin-service/src/migrations/seedFormDefinitions.js` — multiple `acceptedFileTypes`, `maxFileSize` (e.g. lines 66–69, 571–575).  
- **Virus/malware scanning:** No ClamAV or similar integration → **not implemented**.  

---

### API Validation — **Implemented (Schema)** ✓  
**Target:** Schema = yes; Auto + feedback = partial  

- **Joi schema validation:**  
  - `backend/services/auth-service/src/middleware/validation.js` — `validateBody(schema)` used on routes.  
  - All auth routes use Joi schemas (login, signup, verify, profile, password, MFA, webauthn, session).  
- **Structured feedback:** Validation errors returned with field-level messages (e.g. Joi `.messages()`); no separate "auto + feedback" doc (e.g. OpenAPI error schema).  

---

### NoSQL Injection — **Implemented** ✓  
**Target:** ORM + validation  

- **Mongoose queries:** No raw `$where` or user-controlled operators in critical paths; queries use model methods and validated inputs.  
- **Input validation/sanitization:** Joi + sanitizer (including `containsXss` / `containsSqlInjection`) on inputs that affect queries (e.g. profile, business owner, admin users).  
- **Fee calculator:** `backend/services/business-service/src/lib/feeCalculator.js` — line 52: regex escape for `lineOfBusiness` before use in query.  

---

### CSRF — **Implemented** ✓  
**Target:** SameSite + token  

- **Double-submit cookie + SameSite:**  
  - `backend/shared/csrf.js` — lines 2–9, 13–27, 51–75: `createCsrfMiddleware`, `getCsrfTokenHandler`; cookie `sameSite`, `maxAge`; comment *REQUIREMENT IAS-2.7*.  
  - `backend/services/auth-service/src/lib/csrf.js` — same pattern (lines 2, 27–45, 54–78).  
- **Auth service:**  
  - `backend/services/auth-service/src/routes/index.js` — lines 30–33: `getCsrfTokenHandler({ sameSite: 'lax' })`, `createCsrfMiddleware`; comment *REQUIREMENT IAS-2.7*.  
- **Other services:**  
  - `backend/services/business-service/src/index.js` — lines 42–46: CSRF token endpoints and middleware for business, inspector, lgu-officer.  
  - `backend/services/admin-service/src/index.js` — lines 42–48: admin CSRF token and middleware.  
- **Web client:**  
  - `web/src/lib/http.js` — lines 7–21, 137–170, 292–301: get CSRF token, send `X-CSRF-Token` on mutating requests, map `csrf_invalid` to user message.  

---

## Category 3: Database Security

### Credential Storage — **Implemented (Secure .env)** ✓  
**Target:** Secure .env (Vault = optional)  

- **No hardcoded credentials:** DB URI from env.  
- **Env usage:**  
  - `backend/services/auth-service/src/index.js` — line 25: `process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL`; same pattern in admin, business, audit services.  
- **.env.example / docs:** README and deployment docs reference `.env` and not committing secrets; no Vault in repo.  

---

### Access Control — **Implemented (RBAC)** ✓  
**Target:** RBAC  

- **JWT + role:**  
  - `backend/services/auth-service/src/middleware/auth.js` — lines 10–11 (role in payload), 67–77: `requireRole(allowedRoles)` with comment *REQUIREMENT IAS-3.2: role-based access control*.  
- **Role checks:** Used across auth, admin, business, audit (e.g. `requireRole(['admin'])`, `requireJwt` then role checks).  
- **MongoDB app user:**  
  - `deploy/mongo-init/01-create-app-user.js` — least-privilege app user; README line 93 references IAS-3.7.  

---

### Encryption at Rest — **Documented / infra** ✓  
**Target:** Full or Field + TDE  

- **Not in app code:** Documented as infrastructure (Atlas, disk/volume encryption).  
- **Docs:**  
  - `docs/security/database.md` — IAS-3.3, encryption at rest (Atlas, VM disk, LUKS); "Implementation in this repo" section.  

---

### Backup Security — **Implemented** ✓  
**Target:** Encrypted + offsite (encrypted = yes; offsite = ops)  

- **Encrypted backups:**  
  - `deploy/backup.sh` — lines 76–84: `BACKUP_ENCRYPTION_PASSWORD`, `openssl enc -aes-256-cbc ...` → `.archive.enc`.  
  - `deploy/restore.sh` — lines 52–59: decrypt `.archive.enc` with `BACKUP_ENCRYPTION_PASSWORD`.  
- **Docs:**  
  - `README.md` — line 93; `docs/security/database.md`; `docs/deployment/production.md` — line 31; `docs/maintenance/README.md` — lines 17–18.  

---

### Audit Logging — **Implemented** ✓  
**Target:** Full logs / real-time alerts  

- **Audit log model and writes:**  
  - `backend/services/auth-service/src/lib/auditLogger.js` — audit logging helper.  
  - `backend/services/auth-service/src/models/AuditLog.js` — event types (e.g. session_invalidated, mfa_enabled).  
  - Routes log sensitive actions: e.g. `session.js` (invalidate/invalidate-all), `profilePassword.js`, `passwordReset.js`, `deleteAccount.js`, `webauthn.js`, admin approvals.  
- **Audit service and blockchain:**  
  - `backend/services/audit-service/src/routes/audit.js`, `lib/auditLogger.js`, `lib/blockchainService.js`, `jobs/verifyAuditIntegrity.js` — audit ingestion and integrity.  
- **Tamper incidents:**  
  - `backend/services/admin-service/src/routes/tamperIncidents.js`, `models/TamperIncident.js` — tamper detection and response.  

---

### Connection Security — **Documented / infra** ✓  
**Target:** Valid TLS (mTLS = optional)  

- **TLS for DB:** Documented in `docs/security/database.md` (IAS-3.6); Atlas uses TLS; local dev may use plain.  
- **App-to-DB:** Connection string with `tls` when using Atlas; no mTLS/pinning in repo.  

---

### Hardening — **Documented / infra** ✓  
**Target:** Hardened / Scanned + patched  

- **Docs:** `docs/security/database.md` — IAS-3.7 (hardening, least privilege, updates).  
- **Mongo init:** `deploy/mongo-init/01-create-app-user.js` — app user with limited scope.  

---

## Category 4: Threat Modeling

### Data Flow Diagram (DFD) — **Implemented** ✓  
**Target:** Detailed / Trust boundaries  

- **Docs:**  
  - `temp/docs/security-data-flow.md` — data flow.  
  - `temp/docs/security-risk-analysis.md` — referenced with data flow.  
  - `temp/docs/system-architecture.svg` — architecture diagram.  
  - `docs/README.md` — line 5: "threat model (STRIDE, OWASP, risk analysis, data flow)".  
  - `temp/docs/security-requirements-traceability.md` — line 30: IAS-4.1 DFD references.  

---

### STRIDE — **Implemented** ✓  
**Target:** All STRIDE / Detailed  

- **STRIDE doc:**  
  - `temp/docs/security-stride.md` — line 1: "STRIDE Threat Model (IAS-4.2)"; table by component with mitigations.  
  - `temp/information_assurance_and_security.md` — lines 222–231, 543+: STRIDE overview and table.  
  - `docs/security/README.md` — threat-model link; `docs/security/threat-model.md`.  

---

### OWASP — **Implemented** ✓  
**Target:** Top 10 / + CVSS  

- **OWASP mapping:**  
  - `temp/docs/security-owasp-mapping.md` — "OWASP Top 10:2021" mapped to controls and code.  
  - `temp/docs/security-requirements-traceability.md` — line 31: IAS-4.3 OWASP mapping.  
  - `temp/information_assurance_and_security.md` — lines 441–455, 674+: OWASP Top 10 and STRIDE–OWASP table.  
  - `docs/security/zap-security-report-guide.md` — OWASP ZAP usage.  

---

### Mitigation Plan — **Implemented** ✓  
**Target:** Prioritized / Owners + timeline  

- **Risk and mitigation:**  
  - `temp/docs/security-risk-analysis.md` — risk analysis.  
  - `temp/docs/security-stride.md` — STRIDE mitigations per component.  
  - `temp/docs/security-requirements-traceability.md` — IAS requirements and implementation refs.  
  - Full mitigation owners/timeline not in a single table; spread across risk and STRIDE docs.  

---

### Risk Assessment — **Implemented** ✓  
**Target:** Qualitative / Quantitative  

- **Risk analysis:**  
  - `temp/docs/security-risk-analysis.md` — risk assessment.  
  - `temp/docs/security-stride.md` — threat/risk per component.  
  - `temp/information_assurance_and_security.md` — "quantitative risk scoring" and "periodic reviews" mentioned (line 534).  

---

### Updates — **Documented (process)** ✓  
**Target:** Regular / Automated  

- **Review process:**  
  - `docs/maintenance/README.md` — lines 22–26: "Threat model review (IAS-4.6)", "at least annually or with each major release", "Last reviewed" in threat-model docs.  
  - `temp/docs/security-requirements-traceability.md` — line 35: IAS-4.6 "Model updated regularly", "Last reviewed" in STRIDE and risk-analysis.  
- **Automated model updates:** Not implemented; process is manual review.  

---

### Documentation (Threat Modeling) — **Implemented** ✓  
**Target:** Clear / Visual  

- **STRIDE, OWASP, data flow, risk analysis:** See above; multiple linked docs and tables.  
- **Visual:** `temp/docs/system-architecture.svg`; architecture and flow described in docs.  

---

## Category 5: Documentation

### README — **Implemented** ✓  
**Target:** Full + security  

- **Root README:**  
  - `README.md` — structure, quick start, Docker, DB (MongoDB auth, IAS-3.7), backup encryption (line 93), link to docs.  
- **Docs index:**  
  - `docs/README.md` — security, deployment, troubleshooting, maintenance, LOB AI; link to IAS checklist.  

---

### Security Documentation — **Implemented** ✓  
**Target:** Detailed  

- **Security hub:**  
  - `docs/security/README.md` — overview (auth, validation, CSRF, rate limit, DB, audit), links to database.md, csrf.md, threat-model.md, requirements-traceability.md; code refs and IAS checklist link.  
- **Supporting docs:**  
  - `docs/security/database.md` — IAS-3.3, 3.4, 3.6, 3.7.  
  - `docs/security/csrf.md` — CSRF.  
  - `docs/security/threat-model.md` — STRIDE, OWASP, review.  
  - `docs/security/requirements-traceability.md` — traceability matrix.  
  - `docs/security/zap-security-report-guide.md`, `docs/security/manual-risk-testing-guide.md`, `docs/security/zap-report-understanding.md`.  

---

### API Documentation — **Partial** ✓  
**Target:** Full spec  

- **No single OpenAPI/Swagger file** in repo.  
- **Endpoint coverage:** Auth, business, admin, audit routes are structured and testable; mfa_api.md, PASSKEY_*.md in web/docs; no central "full spec" document.  

---

### Deployment — **Implemented** ✓  
**Target:** Secure  

- **Deployment docs:**  
  - `docs/deployment/README.md` — scenarios (local, Atlas, production), quick reference.  
  - `docs/deployment/local.md`, `docs/deployment/atlas.md`, `docs/deployment/production.md` — env, backups, encryption, TLS.  
- **README:** Quick start with Docker, `.env`, and link to docs (lines 86–93).  

---

### Troubleshooting — **Implemented** ✓  
**Target:** Full  

- **Troubleshooting guide:**  
  - `docs/troubleshooting/README.md` — Docker/start.sh, MongoDB, IPFS, auth, APIs, encrypted backups, etc.  

---

### Maintenance — **Implemented** ✓  
**Target:** Schedule  

- **Maintenance doc:**  
  - `docs/maintenance/README.md` — DB password rotation, backups, threat model review (IAS-4.6), dependencies, MFA reset, audit logs, Docker, logs.  

---

### Accessibility — **Not audited**  
**Target:** Basic / Searchable  

- **Docs:** No dedicated accessibility doc found; not evaluated for this checkpoint.  

---

## Summary Table

| Category | Item | Status | Notes |
|----------|------|--------|------|
| 1 | Password Storage | ✓ | bcrypt, salt rounds 10 |
| 1 | Session Management | ✓ | Expiry + secure/sameSite cookie |
| 1 | Error Handling | ✓ | Generic login errors + safe messages |
| 1 | Brute Force Protection | ✓ Rate / ✗ CAPTCHA | Rate limit + lockout; no CAPTCHA |
| 1 | MFA / 2FA | ✓ | TOTP + WebAuthn; staff forced MFA |
| 1 | Token Security | ✓ | Short-lived JWT + tokenVersion |
| 1 | Password Policy | ✓ | Length+complexity + 90-day expiry |
| 1 | Logout / Inactivity | ✓ | Invalidate + session timeout |
| 1 | Extra Credit (Passkeys) | ✓ | WebAuthn implemented |
| 2 | Server Validation | ✓ | Joi + sanitization |
| 2 | SQL Injection | ✓ | ORM + SQL pattern detection |
| 2 | XSS | ✓ Sanitize / ✗ CSP | Sanitize + XSS check; no CSP header |
| 2 | File Upload | ✓ Type+size+content / ✗ Scanning | Type, size, magic bytes; no AV |
| 2 | API Validation | ✓ | Joi schema on routes |
| 2 | NoSQL Injection | ✓ | Mongoose + validation/sanitize |
| 2 | CSRF | ✓ | SameSite + double-submit token |
| 3 | Credential Storage | ✓ | Secure .env |
| 3 | Access Control | ✓ | RBAC (requireRole, JWT) |
| 3 | Encryption at Rest | ✓ | Documented (infra) |
| 3 | Backup Security | ✓ | Encrypted backups (AES-256) |
| 3 | Audit Logging | ✓ | AuditLog + blockchain/tamper |
| 3 | Connection Security | ✓ | Documented (TLS) |
| 3 | Hardening | ✓ | Documented + mongo-init |
| 4 | DFD | ✓ | security-data-flow, risk-analysis, diagram |
| 4 | STRIDE | ✓ | security-stride.md |
| 4 | OWASP | ✓ | security-owasp-mapping.md |
| 4 | Mitigation Plan | ✓ | Risk + STRIDE docs |
| 4 | Risk Assessment | ✓ | security-risk-analysis |
| 4 | Updates | ✓ | Process (annual/major release) |
| 4 | Documentation (TM) | ✓ | Multiple linked docs |
| 5 | README | ✓ | Full + security refs |
| 5 | Security Documentation | ✓ | security/README + detailed docs |
| 5 | API Documentation | Partial | No single OpenAPI spec |
| 5 | Deployment | ✓ | deployment/ + secure options |
| 5 | Troubleshooting | ✓ | troubleshooting/README |
| 5 | Maintenance | ✓ | maintenance/README + schedule |
| 5 | Accessibility | — | Not audited |

---

*Generated from codebase search and doc review. For the original checkpoint form, see `temp/ias2_checkpoint2_requirements.md`.*
