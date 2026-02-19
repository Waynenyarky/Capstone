# Production Deployment

Guidance for deploying the Capstone application in a production-like environment: compose variants, environment hardening, backups, and optional TLS.

## Compose and environment

- Use the **production override** so services run with `NODE_ENV=production` and without dev bypasses:
  ```bash
  docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
  ```
  If you use Atlas (no local MongoDB), combine with the Atlas override:
  ```bash
  docker compose -f docker-compose.yml -f docker-compose.atlas.yml -f docker-compose.prod.yml up -d
  ```

- **Optional TLS for MongoDB** (self-hosted): Use [scripts/mongo-tls-certs.sh](../../scripts/mongo-tls-certs.sh) to generate certs, then:
  ```bash
  docker compose -f docker-compose.yml -f docker-compose.tls.yml -f docker-compose.prod.yml up -d
  ```
  Production must use a proper CA and must **not** use `tlsAllowInvalidCertificates`. See [../security/database.md](../security/database.md) for the TLS runbook.

## Environment hardening

Set these in `.env` (or your secrets manager); **never** commit real values to git.

| Variable | Production guidance |
|----------|----------------------|
| `JWT_SECRET` | Strong, random secret; rotate per policy. |
| `MONGO_URI` | Use Atlas `mongodb+srv://...` or self-hosted with `tls=true`; strong DB password. |
| `MONGO_ROOT_USER`, `MONGO_ROOT_PASSWORD`, `MONGO_APP_USER`, `MONGO_APP_PASSWORD` | Strong passwords; rotate DB user password periodically (e.g. every 90 days). |
| `BACKUP_ENCRYPTION_PASSWORD` | Set so [deploy/backup.sh](../../deploy/backup.sh) produces encrypted `.archive.enc` backups. |
| `AUDIT_SERVICE_API_KEY` | Required for write endpoints; store in secrets; rotate periodically. |
| `CORS_ORIGIN` | Set to the real frontend origin (e.g. `https://your-app.example.com`). |
| `SEED_DEV` | Do **not** set to `true` in production (or use a dedicated prod seed if needed). |
| `EMAIL_API_KEY`, `DEFAULT_FROM_EMAIL` | Use a verified sender; keep API key in secrets. |

See [.env.example](../../.env.example) for the full list.

## Backups

- Run [deploy/backup.sh](../../deploy/backup.sh) on a **schedule** (e.g. daily via cron). Set `BACKUP_ENCRYPTION_PASSWORD` so backups are encrypted (AES-256); output is `.archive.enc`.
- Optional: upload to S3 with `./deploy/backup.sh --s3 your-bucket-name`.
- **Restore:** [deploy/restore.sh](../../deploy/restore.sh) accepts a path to a backup file (plain `.archive` or `.archive.enc`). For `.enc` files, set `BACKUP_ENCRYPTION_PASSWORD` in the environment. Ensure MongoDB is reachable and app user credentials in `.env` are correct.

## Frontend build (demo/production build)

For a production-style frontend build (e.g. served by a reverse proxy):

- Set `VITE_BACKEND_ORIGIN` to your API base URL (e.g. `https://api.your-app.example.com`) so the built assets call the correct backend.
- Build: `cd web && npm run build`. Serve the `dist/` output with HTTPS.

## Security checklist

Before going live:

- [ ] All secrets from env/vault; no defaults or placeholders in production.
- [ ] Database: encryption at rest (Atlas or encrypted volume); TLS for connections; least-privilege DB user. See [../security/database.md](../security/database.md).
- [ ] CSRF and rate limiting enabled; CORS set to the real frontend origin. See [../security/csrf.md](../security/csrf.md) and [../security/README.md](../security/README.md).
- [ ] Backups encrypted and tested restore; runbook for DB password rotation and threat model review. See [../maintenance/README.md](../maintenance/README.md).
