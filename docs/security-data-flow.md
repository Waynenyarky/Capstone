# Security Data Flow (IAS-4.1)

High-level data flow for security and threat-modeling reference. See also [system-architecture.svg](system-architecture.svg) and [security-risk-analysis.md](security-risk-analysis.md) (IPO-style flows).

---

## 1. User → API → Database

```
[User / Browser]
       │ credentials, form data, cookies
       ▼
[API Gateway / Reverse proxy]  (optional; TLS termination)
       │
       ▼
[Auth / Admin / Business / Audit services]
       │ JWT validation, RBAC, CSRF check, validation, sanitization
       ▼
[MongoDB]  (TLS in production; encryption at rest per deployment)
```

- **Auth:** Login/signup/MFA/passkey → auth-service → User, Session, AuditLog.
- **Business:** Permit applications, profile updates → business-service (and auth for identity) → MongoDB.
- **Admin:** Approvals, form definitions, config → admin-service → MongoDB.
- **Audit:** Log/verify hashes → audit-service → MongoDB and (optionally) blockchain.

---

## 2. Service-to-service

- **Auth → Admin/Business:** JWT in `Authorization` header; admin/business verify JWT (shared secret or auth-service as issuer).
- **Admin/Business → Audit:** Audit log entries or document hashes; service auth (e.g. X-API-Key) where required.
- **Outbound:** Email (SMTP), IPFS, blockchain RPC — URLs/credentials from env; no user-controlled URLs for SSRF safety.

---

## 3. Trust boundaries

| Boundary | Controls |
|----------|----------|
| User ↔ API | HTTPS, CSRF token, cookies (sameSite), CORS |
| API ↔ DB | TLS, least-privilege DB user, network restriction |
| API ↔ external | Config-only URLs and credentials; no arbitrary user URL fetch |

---

*Reference: [security-stride.md](security-stride.md), [security-owasp-mapping.md](security-owasp-mapping.md).*
