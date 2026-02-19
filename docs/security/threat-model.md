# Threat Model (IAS-4.1, 4.2, 4.3, 4.4, 4.5, 4.6)

Consolidated threat modeling: data flow, STRIDE, OWASP Top 10 mapping, risk analysis, and mitigation priorities. Review at least annually or per major release (IAS-4.6).

**Last reviewed:** 2025-02

---

## 1. Data flow (IAS-4.1)

### User → API → Database

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

### Service-to-service

- **Auth → Admin/Business:** JWT in `Authorization` header; admin/business verify JWT (shared secret or auth-service as issuer).
- **Admin/Business → Audit:** Audit log entries or document hashes; service auth (e.g. X-API-Key) where required.
- **Outbound:** Email (SMTP), IPFS, blockchain RPC — URLs/credentials from env; no user-controlled URLs for SSRF safety.

### Trust boundaries

| Boundary | Controls |
|----------|----------|
| User ↔ API | HTTPS, CSRF token, cookies (sameSite), CORS |
| API ↔ DB | TLS, least-privilege DB user, network restriction |
| API ↔ external | Config-only URLs and credentials; no arbitrary user URL fetch |

---

## 2. STRIDE (IAS-4.2)

| STRIDE | Threat | Component(s) | Mitigation |
|--------|--------|--------------|------------|
| **S**poofing | User/browser impersonation | Auth, all APIs | bcrypt, JWT with expiry and tokenVersion; MFA/passkey; generic login errors. |
| **S**poofing | Service impersonation | Service-to-service | X-API-Key; keys in env. |
| **T**ampering | Request/response tampering | All APIs | HTTPS; validation and sanitization; CSRF ([csrf.md](csrf.md)). |
| **T**ampering | Data tampering at rest | MongoDB | Encryption at rest; hardened DB ([database.md](database.md)). |
| **R**epudiation | User denies action | State-changing flows | Audit logging; blockchain audit. |
| **I**nformation disclosure | Credentials or PII | Auth, APIs, DB | Secrets in .env/vault; generic errors; RBAC. |
| **I**nformation disclosure | XSS / injection | Profile, forms | Sanitizer; NoSQL/regex escaping; file type/size checks. |
| **D**enial of service | Login/API abuse | Auth, APIs | Rate limiting; file size limits; validation. |
| **E**levation of privilege | Admin functions | Admin, business, audit | RBAC; step-up; staff MFA required. |

Code: [auth-service middleware and routes](../../backend/services/auth-service), [backend/shared/csrf.js](../../backend/shared/csrf.js).

---

## 3. OWASP Top 10 mapping (IAS-4.3)

| OWASP Top 10 (2021) | How we address it |
|---------------------|---------------------|
| **A01 – Broken Access Control** | RBAC (requireRole); step-up for sensitive admin actions; session invalidation; tokenVersion check. |
| **A02 – Cryptographic Failures** | bcrypt; secrets in env; TLS for DB; HTTPS in production. |
| **A03 – Injection** | Joi validation; sanitization (XSS, NoSQL); Mongoose; no raw SQL. |
| **A04 – Insecure Design** | Threat modeling; STRIDE; data flow; risk assessment (this doc). |
| **A05 – Security Misconfiguration** | No default secrets; CORS and cookie options; CSRF and rate limits enabled. |
| **A06 – Vulnerable Components** | package.json; periodic `npm audit` and upgrade policy. |
| **A07 – Identification and Authentication Failures** | Strong password policy; MFA (TOTP, passkey); generic login errors; rate limiting; secure sessions. |
| **A08 – Software and Data Integrity** | Audit logging; blockchain audit; verify-data recomputes hash server-side. |
| **A09 – Logging and Monitoring** | Audit logs; correlation IDs; security monitor middleware. |
| **A10 – SSRF** | No user-controlled URLs for outbound requests; inter-service calls use configured URLs. |

---

## 4. Risk analysis summary (IAS-4.5)

Risks are documented in Input → Processing → Output form for AI validation and blockchain audit prototypes. Key risks include: malicious CSV upload; prompt injection in form fields; oversized input/DoS; API key leakage; fake hash logging; X-API-Key theft; rate limit bypass; replay/verification spoofing. Mitigations: sanitization, structured prompts, rate limiting, least-privilege, secrets in env, server-side hash verification.

---

## 5. Mitigation priorities (IAS-4.4)

| Priority | Risks (summary) | Status |
|----------|------------------|--------|
| High | Prompt injection; API key leakage; fake hash logging; X-API-Key theft; replay/verification spoofing | Implemented or documented |
| Medium | Oversized input/DoS; model poisoning; information leakage; rate limit bypass; Ganache/RPC | Implemented or deployment |
| Low | Hash enumeration | Documented; rate limit on verify if needed |

Review priorities with each release or at least annually.

---

## 6. Review cadence (IAS-4.6)

- Update the **Last reviewed** date at the top of this document when the threat model is reviewed.
- Review at least **annually** or with each **major release**.
- Re-run STRIDE and risk assessment when adding major features or external integrations.

Source material: STRIDE, OWASP, risk analysis, and data flow were consolidated from the project’s security docs; full IAS checklist: [../../temp/information_assurance_and_security_checklist.md](../../temp/information_assurance_and_security_checklist.md).
