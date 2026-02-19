# Maintenance Notes

Recurring tasks and operational reminders for the Capstone application.

---

## Database

### Rotate DB user password

- **Atlas:** In Atlas **Database Access**, change the app user’s password. Update `MONGO_URI` in `.env` (and any secrets store) with the new password; URL-encode special characters. Redeploy or restart services so they use the new credentials.
- **Self-hosted (Docker):** Change the password in MongoDB (e.g. via `mongosh` as admin), update [deploy/mongo-init/01-create-app-user.js](../../deploy/mongo-init/01-create-app-user.js) for new installs if you store the password there, and set `MONGO_APP_PASSWORD` / `MONGO_URI` in `.env`. Restart services.
- **Runbook sentence** (from [security/database.md](../security/database.md)): *"DB user password is strong and rotated every 90 days."* Add a calendar reminder or runbook step for rotation.

### Backups

- **Schedule:** Run [deploy/backup.sh](../../deploy/backup.sh) on a schedule (e.g. daily via cron). Store backups in a secure location (e.g. encrypted volume or S3 with encryption).
- **Encryption:** Set `BACKUP_ENCRYPTION_PASSWORD` in `.env` so backups are AES-256 encrypted (`.archive.enc`). Document the password securely; restore requires it. See [deployment/production.md](../deployment/production.md).
- **Test restore:** Periodically run [deploy/restore.sh](../../deploy/restore.sh) against a test copy to verify backups are usable.

---

## Security and compliance

### Threat model review (IAS-4.6)

- Review the threat model at least **annually** or with each **major release**.
- Update the **"Last reviewed"** date in [security/threat-model.md](../security/threat-model.md).
- Re-run STRIDE and risk assessment when adding major features or external integrations.

### Dependencies

- Run **`npm audit`** in backend and web directories; fix or accept risks for known vulnerabilities.
- Update dependencies on a schedule; pay attention to pinned or major versions that need manual review. Prefer updating one area at a time and running tests.

---

## Application

### MFA reset

- **Admin MFA reset:** [backend/scripts/reset-admin-mfa.js](../../backend/scripts/reset-admin-mfa.js) — use when an admin loses MFA access (e.g. lost device). Run with the admin email; the user can set up MFA again on next login.
- **User MFA reset:** [backend/scripts/reset-user-mfa.js](../../backend/scripts/reset-user-mfa.js) — same for non-admin users. Run from project root with the appropriate Node environment and `.env` (e.g. `node backend/scripts/reset-admin-mfa.js admin@example.com`).

### Audit logs

- **Storage:** Audit log entries are stored in MongoDB (e.g. `AuditLog` collections in auth, admin, business, audit services). The admin UI can expose logs for review.
- **Retention:** If you have a retention policy, implement it (e.g. periodic cleanup or archive) and document it here or in a runbook.

---

## Infrastructure

### Docker

- **Clean unused resources:** Run `./start.sh --clean` (or `docker system prune` as needed) to remove unused containers, networks, and optionally images. Be careful not to remove volumes that hold data you need.
- **Rebuild images:** When Dockerfile or base images change, rebuild and redeploy (e.g. `docker compose build --no-cache` and then `up`).

### Logs

- **Service logs:** Use `docker logs <container-name>` (e.g. `capstone-auth-service`) or a log aggregator. Logs go to stdout/stderr by default.
- **Log rotation:** If you persist container logs to disk, configure log rotation (e.g. Docker logging driver options or host-level logrotate) to avoid filling disk.

---

## Secrets

- **Never commit** `.env` or real secrets to the repository. Use `.env.example` as a template only (no real values).
- **Rotation:** Rotate **JWT_SECRET**, **API keys** (e.g. SendGrid, audit service), and **DB credentials** per policy. Document steps: update env/vault, restart services, and (for JWT) expect existing sessions to be invalidated when the secret changes.
- See [deployment/production.md](../deployment/production.md) for production env hardening and [security/database.md](../security/database.md) for DB password rotation.
