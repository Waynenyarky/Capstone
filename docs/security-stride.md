# STRIDE Threat Model (IAS-4.2)

This document maps **STRIDE** threats (Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege) to system components and existing mitigations.

**Last reviewed:** 2025-02 (review periodically; see IAS-4.6).

---

## Trust boundaries

- **User / browser** ↔ **API (auth, admin, business, audit)**
- **API services** ↔ **MongoDB**
- **API services** ↔ **external services** (e.g. email, IPFS, blockchain RPC)

---

## STRIDE by component

| STRIDE | Threat | Component(s) | Mitigation (reference) |
|--------|--------|--------------|------------------------|
| **S**poofing | User/browser impersonation | Auth, all APIs | Strong auth: bcrypt, JWT with expiry and tokenVersion ([auth.js](backend/services/auth-service/src/middleware/auth.js)), MFA/passkey ([mfa.js](backend/services/auth-service/src/routes/mfa.js), [webauthn.js](backend/services/auth-service/src/routes/webauthn.js)). Generic login errors to prevent user enumeration ([login.js](backend/services/auth-service/src/routes/login.js)). |
| **S**poofing | Service impersonation | Service-to-service (e.g. audit log) | X-API-Key / service auth; keys in env, never in repo. See [security-risk-analysis.md](security-risk-analysis.md) risks 9–10. |
| **T**ampering | Request/response tampering | All APIs | HTTPS in production; input validation and sanitization ([validation.js](backend/services/auth-service/src/middleware/validation.js), [sanitizer.js](backend/services/auth-service/src/lib/sanitizer.js)); CSRF ([backend/shared/csrf.js](../backend/shared/csrf.js)). |
| **T**ampering | Data tampering at rest | MongoDB | Encryption at rest and hardened DB (deployment/infra). See [security-database.md](security-database.md). |
| **R**epudiation | User denies action | All state-changing flows | Audit logging ([AuditLog](backend/services/auth-service/src/models/AuditLog.js), createAuditLog in routes); blockchain audit for integrity. |
| **I**nformation disclosure | Leak of credentials or PII | Auth, APIs, DB | Secrets in .env/vault ([.env.example](../backend/.env.example)); generic error messages ([login.js](backend/services/auth-service/src/routes/login.js)); RBAC ([auth.js](backend/services/auth-service/src/middleware/auth.js) requireRole). |
| **I**nformation disclosure | XSS / injection | Profile, forms | Sanitizer and validation ([sanitizer.js](backend/services/auth-service/src/lib/sanitizer.js)); NoSQL/regex escaping; file type/size checks. |
| **D**enial of service | Login/API abuse | Auth, APIs | Rate limiting ([rateLimit.js](backend/services/auth-service/src/middleware/rateLimit.js), [login.js](backend/services/auth-service/src/routes/login.js)); file size limits; validation to reject oversized input. |
| **E**levation of privilege | Access to admin functions | Admin, business, audit | RBAC and step-up ([auth.js](backend/services/auth-service/src/middleware/auth.js) requireRole, requireAdminStepUp); staff MFA required ([adminUsers.js](backend/services/auth-service/src/routes/adminUsers.js)). |

---

## Cross-reference

- Risk assessment and mitigations: [security-risk-analysis.md](security-risk-analysis.md)
- OWASP mapping: [security-owasp-mapping.md](security-owasp-mapping.md)
- Checklist: [temp/information_assurance_and_security_checklist.md](../temp/information_assurance_and_security_checklist.md)
