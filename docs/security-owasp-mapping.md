# OWASP Top 10 Mapping (IAS-4.3)

This document maps **OWASP Top 10:2021** to controls and code in the application.

---

| OWASP Top 10 (2021) | How we address it | Implementation / reference |
|---------------------|--------------------|----------------------------|
| **A01 – Broken Access Control** | Role-based access control; step-up for sensitive admin actions; session invalidation. | [auth.js](backend/services/auth-service/src/middleware/auth.js) (requireRole, requireAdminStepUp), [session.js](backend/services/auth-service/src/routes/session.js) (invalidate), tokenVersion check on JWT. |
| **A02 – Cryptographic Failures** | Strong password hashing (bcrypt); secrets in env; TLS for DB and HTTPS in production. | [login.js](backend/services/auth-service/src/routes/login.js), [signup.js](backend/services/auth-service/src/routes/signup.js) (bcrypt); [.env.example](backend/.env.example); [security-database.md](security-database.md). |
| **A03 – Injection** | Server-side validation (Joi); sanitization (XSS, NoSQL); no raw SQL (MongoDB/Mongoose). | [validation.js](backend/services/auth-service/src/middleware/validation.js), [sanitizer.js](backend/services/auth-service/src/lib/sanitizer.js); Mongoose parameterized queries; regex escaping where $regex used. |
| **A04 – Insecure Design** | Threat modeling and risk assessment; STRIDE and data flow documented. | [security-risk-analysis.md](security-risk-analysis.md), [security-stride.md](security-stride.md), [security-data-flow.md](security-data-flow.md). |
| **A05 – Security Misconfiguration** | No default secrets; CORS and cookie options; CSRF and rate limits enabled. | [index.js](backend/services/auth-service/src/index.js) (cors, cookie sameSite); [shared/csrf.js](backend/shared/csrf.js); [rateLimit.js](backend/services/auth-service/src/middleware/rateLimit.js). |
| **A06 – Vulnerable and Outdated Components** | Dependencies in package.json; no known critical CVEs in locked versions (process: periodic npm audit). | package.json in auth-, admin-, business-, audit-service; recommend `npm audit` and upgrade policy. |
| **A07 – Identification and Authentication Failures** | Strong password policy; MFA (TOTP, passkey); generic login errors; rate limiting; secure sessions. | [passwordValidator.js](backend/services/auth-service/src/lib/passwordValidator.js), [mfa.js](backend/services/auth-service/src/routes/mfa.js), [webauthn.js](backend/services/auth-service/src/routes/webauthn.js), [login.js](backend/services/auth-service/src/routes/login.js), [auth.js](backend/services/auth-service/src/middleware/auth.js). |
| **A08 – Software and Data Integrity Failures** | Audit logging; blockchain audit for tamper-evident logs; no unsigned/unverified client data for critical decisions. | [AuditLog](backend/services/auth-service/src/models/AuditLog.js); audit-service blockchain; verify-data recomputes hash server-side. |
| **A09 – Security Logging and Monitoring Failures** | Audit logs for sensitive actions; correlation IDs; security monitor middleware. | createAuditLog across services; [securityMonitor](backend/services/auth-service/src/middleware/securityMonitor.js); [correlationId](backend/services/auth-service/src/middleware/correlationId.js). |
| **A10 – Server-Side Request Forgery (SSRF)** | No user-controlled URLs for outbound requests in core flows; internal service calls use fixed config. | Inter-service calls use configured base URLs (e.g. env); no arbitrary URL fetch from user input in main auth/admin/business flows. |

---

## Cross-reference

- STRIDE: [security-stride.md](security-stride.md)
- Risk assessment: [security-risk-analysis.md](security-risk-analysis.md)
- IAS checklist: [temp/information_assurance_and_security_checklist.md](../temp/information_assurance_and_security_checklist.md)
