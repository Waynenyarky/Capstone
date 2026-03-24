# Security Requirements Traceability Matrix

One place to link each IAS requirement to its implementation (code or doc) and evidence.

| Requirement ID | Description | Implementation (file + line or doc) | Notes |
|----------------|-------------|--------------------------------------|--------|
| IAS-1.1 | Strong password hashing | [login.js](../../backend/services/auth-service/src/routes/login.js), [signup.js](../../backend/services/auth-service/src/routes/signup.js) | bcrypt.compare / bcrypt.hash |
| IAS-1.2 | Secure sessions with expiry | [auth.js](../../backend/services/auth-service/src/middleware/auth.js), [Session.js](../../backend/services/auth-service/src/models/Session.js) | TTL, exp, expiresAt |
| IAS-1.3 | Generic login errors | [login.js](../../backend/services/auth-service/src/routes/login.js) | invalid_credentials |
| IAS-1.4 | Rate limiting for logins | [login.js](../../backend/services/auth-service/src/routes/login.js), [rateLimit.js](../../backend/services/auth-service/src/middleware/rateLimit.js) | perEmailRateLimit |
| IAS-1.5 | MFA available or enforced | [mfa.js](../../backend/services/auth-service/src/routes/mfa.js), [webauthn.js](../../backend/services/auth-service/src/routes/webauthn.js), [adminUsers.js](../../backend/services/auth-service/src/routes/adminUsers.js) | TOTP, passkey, mustSetupMfa |
| IAS-1.6 | Validated tokens (JWT) | [auth.js](../../backend/services/auth-service/src/middleware/auth.js) | jwt.verify, tokenVersion |
| IAS-1.7 | Strong password policy | [passwordValidator.js](../../backend/services/auth-service/src/lib/passwordValidator.js) | validatePasswordStrength |
| IAS-1.8 | Logout invalidates session | [session.js](../../backend/services/auth-service/src/routes/session.js) | invalidate, tokenVersion |
| IAS-1.9 | OAuth/SSO or advanced auth | [webauthn.js](../../backend/services/auth-service/src/routes/webauthn.js) | Passkey |
| IAS-2.1 | Server-side input validation | [validation.js](../../backend/services/auth-service/src/middleware/validation.js) | validateBody, Joi |
| IAS-2.2 | Parameterized SQL | N/A | App uses MongoDB (Mongoose); no raw SQL. |
| IAS-2.3 | XSS protection | [sanitizer.js](../../backend/services/auth-service/src/lib/sanitizer.js) | sanitizeString, containsXss |
| IAS-2.4 | File upload validation | [formDefinitions.js](../../backend/services/admin-service/src/routes/formDefinitions.js), [profileAvatar.js](../../backend/services/auth-service/src/routes/profileAvatar.js) | multer, mime/size |
| IAS-2.5 | API schema validation | Same as IAS-2.1 | Joi + validateBody |
| IAS-2.6 | NoSQL injection protection | [sanitizer.js](../../backend/services/auth-service/src/lib/sanitizer.js), formDefinitions, feeCalculator | containsSqlInjection |
| IAS-2.7 | CSRF tokens | [shared/csrf.js](../../backend/shared/csrf.js), auth/admin/business routes, [csrf.md](csrf.md) | Double-submit cookie |
| IAS-3.1 | Secure credential storage | [.env.example](../../.env.example) | process.env, no secrets in repo |
| IAS-3.2 | RBAC | [auth.js](../../backend/services/auth-service/src/middleware/auth.js) | requireRole |
| IAS-3.3 | DB encryption at rest | [database.md](database.md) | Documented: Atlas or encrypted host/volume; runbook sentence. |
| IAS-3.4 | Encrypted backups | [backup.sh](../../deploy/backup.sh), [restore.sh](../../deploy/restore.sh), [database.md](database.md) | BACKUP_ENCRYPTION_PASSWORD → AES-256 .enc |
| IAS-3.5 | Audit logging | [AuditLog.js](../../backend/services/auth-service/src/models/AuditLog.js), createAuditLog in routes | Audit trail |
| IAS-3.6 | TLS DB connections | [db.js](../../backend/services/auth-service/src/config/db.js), [database.md](database.md), [docker-compose.tls.yml](../../docker-compose.tls.yml), [mongo-tls-certs.sh](../../scripts/mongo-tls-certs.sh) | Prod: mongodb+srv or tls=true |
| IAS-3.7 | Database hardening | [docker-compose.yml](../../docker-compose.yml), [mongo-init/01-create-app-user.js](../../deploy/mongo-init/01-create-app-user.js), [.env.example](../../.env.example), [backup.sh](../../deploy/backup.sh), [database.md](database.md) | Auth + least-privilege app user |
| IAS-4.1 | Data Flow Diagram | [threat-model.md](threat-model.md), [database.md](database.md) | IPO + data flow in threat-model |
| IAS-4.2 | STRIDE threats | [threat-model.md](threat-model.md) | STRIDE table |
| IAS-4.3 | OWASP Top 10 mapped | [threat-model.md](threat-model.md) | A01–A10 mapping |
| IAS-4.4 | Mitigation plan with priorities | [threat-model.md](threat-model.md) | Priority table |
| IAS-4.5 | Risk assessment done | [threat-model.md](threat-model.md) | Risk summary |
| IAS-4.6 | Model updated regularly | Process; "Last reviewed" in [threat-model.md](threat-model.md) | Periodic review |

---

*Source checklist: [../../temp/information_assurance_and_security_checklist.md](../../temp/information_assurance_and_security_checklist.md).*
