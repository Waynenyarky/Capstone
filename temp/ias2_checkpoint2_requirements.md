Here is Pages 5–8 converted into clean Markdown format:

⸻

ITE 370 – IAS 2

Dr. Engelbert Q. Cruz

SYSTEM SECURITY CHECKPOINT FORM

Tick (✔) the box that best describes the system.
(For Faculty Evaluator use)

⸻

Category 1: Authentication

Password Storage

Are passwords hashed securely?
	•	☐ Plaintext
	•	☐ MD5/SHA1
	•	☐ bcrypt/Argon2
	•	☐ bcrypt + salt/pepper

⸻

Session Management

Do sessions expire and use secure flags?
	•	☐ None
	•	☐ No expiry
	•	☐ Expiry set
	•	☐ Expiry + secure flags

⸻

Error Handling

Do login errors leak information?
	•	☐ Leaks
	•	☐ Inconsistent
	•	☐ Generic
	•	☐ Generic + logs

⸻

Brute Force Protection

Are login attempts limited?
	•	☐ None
	•	☐ Counting
	•	☐ Rate limit
	•	☐ Rate + CAPTCHA

⸻

MFA / 2FA

Is MFA enforced?
	•	☐ None
	•	☐ Planned
	•	☐ Optional
	•	☐ Mandatory (admin)

⸻

Token Security

Are authentication tokens validated?
	•	☐ None
	•	☐ Basic
	•	☐ JWT validated
	•	☐ Short-lived + refresh

⸻

Password Policy

Is there a strong password policy?
	•	☐ None
	•	☐ Length
	•	☐ Length + complexity
	•	☐ + expiration

⸻

Logout / Inactivity

Does logout destroy the session?
	•	☐ None
	•	☐ Partial
	•	☐ Invalidate
	•	☐ Auto timeout

⸻

Extra Credit – Advanced Authentication
	•	☐ None
	•	☐ OAuth/SSO
	•	☐ Biometrics
	•	☐ Hardware/passkeys

⸻

Category 2: Input Validation

Server Validation

Is all input validated server-side?
	•	☐ None
	•	☐ Some
	•	☐ All
	•	☐ + Sanitization

⸻

SQL Injection

Are queries protected?
	•	☐ Raw
	•	☐ Escaped
	•	☐ Parameterized
	•	☐ ORM

⸻

XSS

Is output safely escaped?
	•	☐ None
	•	☐ Basic
	•	☐ Context-aware
	•	☐ CSP + sanitize

⸻

File Upload

Are uploads checked?
	•	☐ None
	•	☐ Type only
	•	☐ Type + size
	•	☐ + scanning

⸻

API Validation

Are APIs validated?
	•	☐ None
	•	☐ Manual
	•	☐ Schema
	•	☐ Auto + feedback

⸻

NoSQL Injection

Are NoSQL queries protected?
	•	☐ None
	•	☐ Filter
	•	☐ Param
	•	☐ ORM + validation

⸻

CSRF

Is CSRF protection enabled?
	•	☐ None
	•	☐ Token
	•	☐ Sync tokens
	•	☐ SameSite + token

⸻

Category 3: Database Security

Credential Storage

How are DB credentials stored?
	•	☐ Hardcoded
	•	☐ Exposed .env
	•	☐ Secure .env
	•	☐ Vault

⸻

Access Control

Who can access the database?
	•	☐ Admin all
	•	☐ Roles
	•	☐ RBAC
	•	☐ RBAC + ABAC

⸻

Encryption at Rest

Is data encrypted?
	•	☐ None
	•	☐ Some
	•	☐ Full
	•	☐ Field + TDE

⸻

Backup Security

Are backups secured?
	•	☐ None
	•	☐ Unencrypted
	•	☐ Encrypted
	•	☐ Encrypted + offsite

⸻

Audit Logging

Are database actions logged?
	•	☐ None
	•	☐ Errors
	•	☐ Full logs
	•	☐ Real-time alerts

⸻

Connection Security

Are connections encrypted?
	•	☐ Plain
	•	☐ Self-signed
	•	☐ Valid TLS
	•	☐ mTLS + pinning

⸻

Hardening

Is the database hardened?
	•	☐ Default
	•	☐ Basic
	•	☐ Hardened
	•	☐ Scanned + patched

⸻

Category 4: Threat Modeling

Data Flow Diagram (DFD)

Is a data flow diagram created?
	•	☐ None
	•	☐ Basic
	•	☐ Detailed
	•	☐ Trust boundaries

⸻

STRIDE

Are threats identified?
	•	☐ None
	•	☐ Few
	•	☐ All STRIDE
	•	☐ Detailed

⸻

OWASP

Is OWASP mapped?
	•	☐ None
	•	☐ Basic
	•	☐ Top 10
	•	☐ + CVSS

⸻

Mitigation Plan

Is there a mitigation plan?
	•	☐ None
	•	☐ Basic
	•	☐ Prioritized
	•	☐ Owners + timeline

⸻

Risk Assessment

Are risks scored?
	•	☐ None
	•	☐ Basic
	•	☐ Qualitative
	•	☐ Quantitative

⸻

Updates

Is the model updated?
	•	☐ Static
	•	☐ Once
	•	☐ Regular
	•	☐ Automated

⸻

Documentation (Threat Modeling)

Is it well documented?
	•	☐ Poor
	•	☐ Basic
	•	☐ Clear
	•	☐ Visual

⸻

Category 5: Documentation

README
	•	☐ None
	•	☐ Basic
	•	☐ Full + security

⸻

Security Documentation
	•	☐ None
	•	☐ List
	•	☐ Detailed

⸻

API Documentation
	•	☐ None
	•	☐ List
	•	☐ Full spec

⸻

Deployment
	•	☐ None
	•	☐ Basic
	•	☐ Secure

⸻

Troubleshooting
	•	☐ None
	•	☐ Some
	•	☐ Full

⸻

Maintenance
	•	☐ None
	•	☐ Notes
	•	☐ Schedule

⸻

Accessibility
	•	☐ No
	•	☐ Basic
	•	☐ Searchable

⸻

Comments

______________________________________________________________

______________________________________________________________

______________________________________________________________