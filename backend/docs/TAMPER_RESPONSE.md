# Audit Log Tamper Response

## Detection
- Job: `verifyAuditIntegrity` (hourly by default, configured via `AUDIT_VERIFY_WINDOW_HOURS` and `AUDIT_VERIFY_MAX`).
- Scope: unverified logs and logs created within the recent window.
- Verification: compares stored hash to record, then checks on-chain hash (when blockchain available).
- Classification:
  - `tamper_detected`: hash mismatch or missing on-chain match.
  - `not_logged`: audit log has no on-chain tx hash.
  - `verification_error`: transient/infra errors (e.g., chain unavailable).
- Resilience: blockchain unavailable is skipped with a warning; verification errors are tracked separately from tamper events.

## Incidents
- Model: `TamperIncident` with status (`new` → `acknowledged` → `resolved`), severity, verificationStatus, affected users, related auditLogIds, containment flag, notes, and verification payload/events.
- Dedupe: upserts per auditLogId while unresolved; updates `lastSeenAt`.
- Containment: `containmentActive` can freeze sensitive actions for affected accounts (apply enforcement where needed).
- Evidence: verification payload stores hashes, tx info, and error/tamper details; audit logs are never rewritten.

## Admin workflow
- List: `GET /api/admin/tamper/incidents` (filters by status/severity); stats at `/api/admin/tamper/incidents/stats`.
- Acknowledge: `POST /api/admin/tamper/incidents/:id/ack` (optional containment toggle).
- Containment toggle: `POST /api/admin/tamper/incidents/:id/contain` (enable/disable containment).
- Resolve: `POST /api/admin/tamper/incidents/:id/resolve` (resolution notes required in UI prompt).
- All admin actions are audit-logged (`security_event`).

## Frontend surfacing
- Admin Dashboard includes a Tamper Incidents panel to view, acknowledge, toggle containment, and resolve incidents; shows status, severity, verification state, and timestamps.

## Operator guidance
- Triage: review incident details and affected users; acknowledge to stop alert noise.
- Contain: enable containment to freeze sensitive actions for impacted accounts until cleared.
- Verify source of truth: rely on on-chain hash when available; do not overwrite audit records.
- Resolve: add resolution notes, lift containment if safe, mark resolved; keep evidence for forensics.

## Metrics
- Stats endpoint exposes counts by status; job logs checked/incident counts for observability. Extend with APM/alerts as needed.
