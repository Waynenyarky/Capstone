# Blockchain Logging + Security Flows

This document explains all blockchain-related logging flows and the implemented security controls in the system. It also highlights what is implemented vs. not yet implemented, with extra detail on the admin side.

## Storage Model (Current Implementation)
- **IPFS**: used for user documents (avatars, IDs) and business registration documents when IPFS is available.
- **MongoDB**: stores user profiles, business profiles, audit logs, approval records, and metadata (including IPFS CIDs when present).
- **Blockchain**: stores proofs or hashes (audit log hashes) and selected critical events (admin approvals, document CIDs, user registry hashes) when contracts are available.
- **Fallbacks**: when IPFS or blockchain are unavailable, the system continues and stores data locally or only in MongoDB.

## Blockchain-Logged Actions (End-to-End Flows)

### 1) Audit Log Hashing (Cross-service)
**Trigger**
- Any service calls `createAuditLog(...)` for a security or profile change.

**Storage**
- MongoDB `AuditLog` stores `eventType`, `fieldChanged`, values, and `hash`.
- Audit Service queues `logAuditHash(hash, eventType)` to blockchain.

**Tamper Detection**
- Audit Service has a background job that verifies recent audit logs against blockchain.

**Response**
- If mismatched or missing on-chain data, a `TamperIncident` is created and flagged as high severity.
- Admins can view, acknowledge, contain, and resolve incidents via admin endpoints.

### 2) Document CID Storage (IPFS -> Blockchain)
**Trigger**
- User uploads avatar or ID (Auth Service).
- Business owner uploads LGU documents (Business Service).

**Storage**
- IPFS stores the file, and the CID is stored in MongoDB.
- Audit Service writes CID to `DocumentStorage` contract when available.

**Tamper Detection**
- If document content is altered, the IPFS CID will change and no longer match the on-chain CID.
- The system can detect mismatch by comparing IPFS CID with blockchain-stored CID.

**Response**
- Document CID mismatch should be treated as tampering and logged via the audit flow.
- No automatic rollback is implemented; the admin incident workflow is used.

### 3) Admin Approvals (Critical Events on-chain)
**Trigger**
- Admin approves or rejects approval requests (email, password, personal info, maintenance).

**Storage**
- MongoDB `AdminApproval` stores approval metadata and votes.
- Admin Service logs approval events to blockchain (`logAdminApproval` + `logCriticalEvent`).

**Tamper Detection**
- On-chain approval record provides immutable proof that an approval happened.

**Response**
- Any discrepancy between MongoDB and blockchain should be treated as an integrity issue and logged via audit/tamper workflows.

### 4) User Registry (Profile Hash on-chain)
**Trigger**
- Audit Service exposes endpoint to register user profile hash on-chain.

**Storage**
- On-chain `UserRegistry` stores `userId`, `address`, and profile hash.

**Tamper Detection**
- Profile hash mismatch indicates off-chain changes.

**Response**
- Not automated; should be verified by admins if implemented in flow.

### 5) Access Control (Role Grants on-chain)
**Trigger**
- Audit Service provides AccessControl API for on-chain roles.

**Storage**
- On-chain `AccessControl` contract stores role grants.

**Tamper Detection**
- On-chain roles can be compared against app roles.

**Response**
- Not currently enforced by API flow; this is available but not wired into role management.

## Tamper Detection and Response (Implemented)

**Detection**
- Audit Service job verifies blockchain hashes for audit logs.
- `verifyAuditIntegrity` classifies mismatches or missing blockchain transactions.

**Response**
- Creates `TamperIncident` in MongoDB.
- Admin endpoints:
  - List incidents
  - View stats
  - Acknowledge
  - Contain
  - Resolve

**Notes**
- Alerts are logged in backend logs; external alerting is not wired.

## Security Controls (Implemented)

### Core Controls (All Roles)
- JWT access tokens with expiration.
- Role-based access checks on protected routes.
- Rate limiting (verification, profile updates, ID uploads, admin approvals).
- Audit logs for security-sensitive actions.
- Account lockout after failed verification attempts.
- Suspicious activity detection (SQLi/XSS patterns, abnormal user agents, repeated rate-limit violations).

### MFA and Strong Auth
- TOTP (Authenticator App) for MFA.
- WebAuthn passkeys (server-side routes implemented).
- Mobile biometrics flow tied into backend MFA status.
- OTP verification for sensitive changes.

### Admin-Specific Security
- Two-person approval for sensitive admin changes (email, password, personal info).
- Admin deletion requires MFA and another admin approval.
- High-privilege task checks before deletion.
- Monitoring endpoint for errors, performance, and security stats.

## Implemented vs Not Implemented (Per Role)

### Admin Role
**Implemented**
- [x] JWT auth and role enforcement.
- [x] MFA required for high-risk flows (admin deletion approvals).
- [x] Two-admin approval workflow for email, password, personal info changes.
- [x] Audit logging for admin approvals and admin actions.
- [x] Blockchain logging of approval decisions (when blockchain available).
- [x] Incident triage endpoints for tamper incidents.
- [x] Monitoring stats endpoint (performance, errors, security).
- [x] Session invalidation via token version on password change.
- [x] Admin account deletion flow with high-privilege task check.

**Not Implemented / Partial**
- [ ] Admin blockchain service is a stub (admin service does not directly interact with blockchain).
- [ ] External alerting (email/SMS/Slack) for tamper incidents is not wired.
- [ ] On-chain role enforcement is not integrated with app RBAC.
- [ ] Automated remediation for tamper incidents (manual admin action required).

### Business Owner Role
**Implemented**
- [x] JWT auth + role checks.
- [x] ID uploads gated by verification (OTP/MFA).
- [x] IPFS upload when available; fallback to local storage.
- [x] IPFS CID stored on-chain via Audit Service when available.
- [x] Audit logs for profile updates and ID verification steps.
- [x] Rate limiting for profile updates and ID uploads.

**Not Implemented / Partial**
- [ ] Business Service IPFS module is stubbed by default (real module exists but not wired).
- [ ] Full business profile hashing and on-chain registry is not integrated in business flow.

### Staff Roles (LGU Officer, Manager, Inspector, CSO)
**Implemented**
- [x] JWT auth + role checks.
- [x] Restricted fields protection (staff cannot edit admin-only fields).
- [x] Audit logging of restricted field attempts.
- [x] Staff deletion request flow with admin approval.

**Not Implemented / Partial**
- [ ] On-chain role mapping for staff roles is not enforced.

### Standard Users
**Implemented**
- [x] JWT auth + role checks.
- [x] Profile changes audited.
- [x] MFA options available (TOTP, WebAuthn, biometrics).

**Not Implemented / Partial**
- [ ] No dedicated on-chain user registry flow invoked by default.

## Admin Security Flow Summary (What Happens When Problems Arise)

1) **Tamper incident detected**
   - Audit Service creates `TamperIncident`.
   - Admin views incidents and acknowledges or contains.
   - Resolution recorded and audited.

2) **Suspicious activity detected**
   - Security monitor logs event to audit trail.
   - Admin can inspect monitoring stats.
   - Manual containment recommended (e.g., account lockouts, session invalidation).

3) **Admin account deletion request**
   - MFA required + unusual IP detection + high-privilege task check.
   - Another admin approves or denies.
   - Deactivation and 30-day deletion timer applied.

## Where Data Lives (Quick Reference)
- **Audit Logs**: MongoDB (`AuditLog`) + blockchain hash proof (when available).
- **Business Data**: MongoDB (`BusinessProfile`), with document CIDs stored in IPFS + blockchain when available.
- **User Documents**: IPFS + MongoDB metadata + blockchain CID when available.
- **Approvals**: MongoDB (`AdminApproval`) + blockchain approval events (when available).
- **Tamper Incidents**: MongoDB (`TamperIncident`) with admin workflows.

## Gaps and Recommendations
- Wire business-service to the real IPFS client by default.
- Add periodic verification that compares MongoDB metadata with on-chain values for document CIDs.
- Add external alerting (email/SMS/Slack) for tamper incidents.
- Consider enforcing on-chain access control for admin/staff roles.
