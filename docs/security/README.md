# Security Documentation

Overview of security controls in the Capstone application: authentication, input validation, CSRF, rate limiting, database security, and audit logging.

## Overview

- **Authentication:** JWT with expiry and tokenVersion; bcrypt password hashing; generic login errors (no user enumeration); rate limiting on login/signup. MFA (TOTP and WebAuthn passkeys) available and enforced for staff; admin step-up for sensitive actions.
- **Input validation:** Server-side Joi schemas on all API bodies; sanitization (XSS, NoSQL-style) and file type/size checks.
- **CSRF:** Double-submit cookie for state-changing requests; see [csrf.md](csrf.md).
- **Rate limiting:** Per-email limits on login/signup; configurable per service.
- **Database security:** Encryption at rest, encrypted backups, TLS for connections, least-privilege DB user; see [database.md](database.md).
- **Audit logging:** Sensitive actions (password change, profile edit, admin actions) logged to AuditLog; blockchain audit for tamper-evident logs.

## Documents in this section

- [database.md](database.md) — Database security (IAS-3.3, 3.4, 3.6, 3.7): encryption at rest, encrypted backups, TLS, hardening.
- [csrf.md](csrf.md) — CSRF protection (IAS-2.7): double-submit cookie, endpoints, SPA integration.
- [threat-model.md](threat-model.md) — STRIDE, OWASP Top 10 mapping, risk analysis, data flow; review cadence (IAS-4.6).
- [requirements-traceability.md](requirements-traceability.md) — Traceability matrix linking each IAS requirement to implementation.

## Code references

- CSRF: [backend/shared/csrf.js](../../backend/shared/csrf.js)
- Auth (JWT, RBAC, MFA): [backend/services/auth-service](../../backend/services/auth-service) (e.g. `src/middleware/auth.js`, `src/routes/login.js`, `src/routes/mfa.js`, `src/routes/webauthn.js`)
- Validation and sanitization: [backend/services/auth-service/src/middleware/validation.js](../../backend/services/auth-service/src/middleware/validation.js), [backend/services/auth-service/src/lib/sanitizer.js](../../backend/services/auth-service/src/lib/sanitizer.js)

## IAS checklist

For the full Information Assurance and Security checklist with implementation and test steps, see [../../temp/information_assurance_and_security_checklist.md](../../temp/information_assurance_and_security_checklist.md).
