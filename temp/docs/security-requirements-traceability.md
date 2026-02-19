# Security Requirements Traceability Matrix

One place to link each IAS requirement to its implementation (code or doc) and evidence.

| Requirement ID | Description | Implementation (file + line or doc) | Notes |
|----------------|-------------|--------------------------------------|--------|
| IAS-1.1 | Strong password hashing | [login.js#L190](backend/services/auth-service/src/routes/login.js#L190), [signup.js#L145](backend/services/auth-service/src/routes/signup.js#L145) | bcrypt.compare / bcrypt.hash |
| IAS-1.2 | Secure sessions with expiry | [auth.js#L5-L7](backend/services/auth-service/src/middleware/auth.js#L5-L7), [Session.js#L42-L46](backend/services/auth-service/src/models/Session.js#L42-L46) | TTL, exp, expiresAt |
| IAS-1.3 | Generic login errors | [login.js#L185](backend/services/auth-service/src/routes/login.js#L185), [login.js#L208](backend/services/auth-service/src/routes/login.js#L208) | invalid_credentials |
| IAS-1.4 | Rate limiting for logins | [login.js#L92-L108](backend/services/auth-service/src/routes/login.js#L92-L108), [rateLimit.js](backend/services/auth-service/src/middleware/rateLimit.js) | perEmailRateLimit |
| IAS-1.5 | MFA available or enforced | [mfa.js](backend/services/auth-service/src/routes/mfa.js), [webauthn.js](backend/services/auth-service/src/routes/webauthn.js), [adminUsers.js](backend/services/auth-service/src/routes/adminUsers.js) | TOTP, passkey, mustSetupMfa |
| IAS-1.6 | Validated tokens (JWT) | [auth.js#L43](backend/services/auth-service/src/middleware/auth.js#L43), [auth.js#L52-L55](backend/services/auth-service/src/middleware/auth.js#L52-L55) | jwt.verify, tokenVersion |
| IAS-1.7 | Strong password policy | [passwordValidator.js#L11](backend/services/auth-service/src/lib/passwordValidator.js#L11) | validatePasswordStrength |
| IAS-1.8 | Logout invalidates session | [session.js#L117](backend/services/auth-service/src/routes/session.js#L117), [session.js#L161](backend/services/auth-service/src/routes/session.js#L161) | invalidate, tokenVersion |
| IAS-1.9 | OAuth/SSO or advanced auth | [webauthn.js](backend/services/auth-service/src/routes/webauthn.js) | Passkey |
| IAS-2.1 | Server-side input validation | [validation.js#L4](backend/services/auth-service/src/middleware/validation.js#L4) | validateBody, Joi |
| IAS-2.2 | Parameterized SQL | N/A | App uses MongoDB (Mongoose); no raw SQL. |
| IAS-2.3 | XSS protection | [sanitizer.js](backend/services/auth-service/src/lib/sanitizer.js) | sanitizeString, containsXss |
| IAS-2.4 | File upload validation | [formDefinitions.js](backend/services/admin-service/src/routes/formDefinitions.js), [profileAvatar.js](backend/services/auth-service/src/routes/profileAvatar.js) | multer, mime/size |
| IAS-2.5 | API schema validation | Same as IAS-2.1 | Joi + validateBody |
| IAS-2.6 | NoSQL injection protection | [sanitizer.js](backend/services/auth-service/src/lib/sanitizer.js), regex escape in formDefinitions, feeCalculator | containsSqlInjection |
| IAS-2.7 | CSRF tokens | [shared/csrf.js](backend/shared/csrf.js), [auth routes#L29-L32](backend/services/auth-service/src/routes/index.js#L29-L32), [security-csrf.md](security-csrf.md) | Double-submit cookie |
| IAS-3.1 | Secure credential storage | [.env.example](backend/.env.example) | process.env, no secrets in repo |
| IAS-3.2 | RBAC | [auth.js#L67](backend/services/auth-service/src/middleware/auth.js#L67) | requireRole |
| IAS-3.3 | DB encryption at rest | [security-database.md](security-database.md) | Documented: Atlas or encrypted host/volume; runbook sentence. |
| IAS-3.4 | Encrypted backups | [backup.sh](../deploy/backup.sh), [restore.sh](../deploy/restore.sh), [security-database.md](security-database.md) | BACKUP_ENCRYPTION_PASSWORD → AES-256 .enc; restore decrypts. |
| IAS-3.5 | Audit logging | [AuditLog.js](backend/services/auth-service/src/models/AuditLog.js), createAuditLog in routes | Audit trail |
| IAS-3.6 | TLS DB connections | [db.js](backend/services/auth-service/src/config/db.js), [security-database.md](security-database.md), [docker-compose.tls.yml](../docker-compose.tls.yml), [mongo-tls-certs.sh](../scripts/mongo-tls-certs.sh) | Prod: mongodb+srv or tls=true; optional TLS in Docker via profile. |
| IAS-3.7 | Database hardening | [docker-compose.yml](../docker-compose.yml), [deploy/mongo-init/01-create-app-user.js](../deploy/mongo-init/01-create-app-user.js), [.env.example](../.env.example), [backup.sh](../deploy/backup.sh), [security-database.md](security-database.md) | Auth + least-privilege app user; MONGO_URI with credentials; runbook. |
| IAS-4.1 | Data Flow Diagram | [security-risk-analysis.md](security-risk-analysis.md), [security-data-flow.md](security-data-flow.md), [system-architecture.svg](system-architecture.svg) | IPO + data flow doc |
| IAS-4.2 | STRIDE threats | [security-stride.md](security-stride.md) | STRIDE table |
| IAS-4.3 | OWASP Top 10 mapped | [security-owasp-mapping.md](security-owasp-mapping.md) | A01–A10 mapping |
| IAS-4.4 | Mitigation plan with priorities | [security-risk-analysis.md](security-risk-analysis.md) §5 | Priority table |
| IAS-4.5 | Risk assessment done | [security-risk-analysis.md](security-risk-analysis.md) | Full risk list |
| IAS-4.6 | Model updated regularly | Process; "Last reviewed" in [security-stride.md](security-stride.md), [security-risk-analysis.md](security-risk-analysis.md) | Periodic review |

---

*Source checklist: [temp/information_assurance_and_security_checklist.md](../temp/information_assurance_and_security_checklist.md).*
