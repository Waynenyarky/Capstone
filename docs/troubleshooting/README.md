# Troubleshooting

Common issues and fixes for Docker, MongoDB, IPFS, auth, and APIs.

---

## Docker / start.sh

### Services don't come up or time out

- **Check status:** Run `./start.sh --status` to see which containers and the web server are running and Docker disk usage.
- **Slower network:** Use `./start.sh --slow-network` (or `-s`) for longer wait times so health checks can pass (e.g. on Codespaces or high-latency networks).
- **Inspect containers:** `docker ps` and `docker ps -a`; check health with `docker inspect <container> --format '{{.State.Health.Status}}'`. Restart a service: `docker compose restart <service-name>`.

### Flag conflicts

- **`--production`** cannot be used with **`--dev`** or **`--clean`**. Use either `./start.sh --production` or `./start.sh --dev` / `./start.sh --clean --dev`.
- **`--demo`** cannot be used with **`--dev`**, **`--demo-ui`**, **`--production`**, or **`--clean`**. The script will print an error; choose one mode.

### Ports already in use

Ports used by the stack: **5173** (Vite dev), **4173** (Vite preview), **3001–3004** (auth, business, admin, audit), **27017** (MongoDB), **7545** (Ganache), **5001** (IPFS API), **8080** (IPFS gateway).

- Find what is using a port (e.g. `lsof -i :3001` or `ss -tlnp | grep 3001`).
- Stop the conflicting process or change the port in `.env` (e.g. `AUTH_SERVICE_PORT=3011`) and ensure the frontend and any proxies use the new ports.

---

## MongoDB

### Connection refused or "MongoServerSelectionError"

- **Local MongoDB:** Ensure the MongoDB container is running (`docker ps | grep mongodb`). From the **host**, use `MONGO_URI` with host `localhost`; from **inside another container**, use host `mongodb` (and the same credentials).
- **Atlas:** Ensure `MONGO_URI` in `.env` is the full Atlas connection string (including `/capstone_project`). Check **Network Access** in Atlas: your server’s IP (or VPC) must be allowed. For special characters in the password, URL-encode them (e.g. `@` → `%40`).
- **Credentials:** Verify `MONGO_APP_USER`, `MONGO_APP_PASSWORD`, and `authSource=admin` (or as required by your setup). See [deployment/atlas.md](../deployment/atlas.md) and [deployment/local.md](../deployment/local.md).

### Atlas: "IP not allowed" or timeouts

- In Atlas: **Network Access** → add your current IP or (dev only) temporarily allow `0.0.0.0/0`. In Codespaces, your outbound IP can change; re-add it or use the Atlas UI to see blocked connection attempts.

---

## IPFS

### IPFS container fails or is slow

- **Skip IPFS:** Start without IPFS: `./start.sh --skip-ipfs`. The app may run with reduced IPFS-dependent functionality.
- **Optional:** Use the no-IPFS compose override: `docker compose -f docker-compose.yml -f docker-compose.no-ipfs.yml up -d` (see project compose files).

---

## Auth / login

### Verification email not received

- **Mailinator / disposable inbox:** Delivery can be delayed or unreliable. Check spam; wait a few minutes.
- **Development shortcut:** Use `./start.sh --dev`. On the login verification screen you’ll see **"Development: your code is XXXXXX"** — enter that code without checking email.
- **Mock sender:** If `EMAIL_API_KEY` is not set (and not production), the auth-service uses a mock sender: the code is only in **auth-service logs** (e.g. `docker logs capstone-auth-service`) or on the verification screen in --dev. Set `EMAIL_API_KEY` and `DEFAULT_FROM_EMAIL` in `.env` for real email; ensure the sender is verified in SendGrid (or your provider).

### "Too many attempts" / rate limiting

- In **development only** you can disable login/signup rate limits by setting `DISABLE_RATE_LIMIT=true` in the **project root** `.env`. Restart the auth-service so it picks up the change: `docker compose up -d --force-recreate auth-service`.
- Do **not** disable rate limiting in production.

### 403 on POST/PUT/PATCH/DELETE (csrf_invalid)

- Mutating requests require a valid CSRF token. The frontend must:
  1. Call `GET /api/auth/csrf-token` (and optionally admin/business CSRF endpoints if it calls those APIs) with credentials (e.g. `credentials: 'include'`).
  2. Send the returned token in the **`X-CSRF-Token`** header on every POST/PUT/PATCH/DELETE.
- Ensure the app is not blocking or stripping cookies (same-origin, correct CORS). See [security/csrf.md](../security/csrf.md).

---

## Frontend / API

### CORS errors in the browser

- Set **`CORS_ORIGIN`** in the **project root** `.env` to the origin the browser uses (e.g. `http://localhost:5173` for the Vite dev server). Restart the API services after changing `.env`.

### Production build (e.g. --demo) calls wrong API host

- Set **`VITE_BACKEND_ORIGIN`** to the API base URL (e.g. `http://localhost:3001` or your deployed API URL). It is baked in at build time; rebuild the web app after changing it.

---

## Backup / restore scripts

### backup.sh or restore.sh fails

- **Encrypted backups (`.archive.enc`):** Restore requires **`BACKUP_ENCRYPTION_PASSWORD`** set in `.env` (or environment) to match the password used when the backup was created. If it’s missing or wrong, decryption fails.
- **MongoDB reachable:** Backup and restore need to connect to MongoDB. For local Docker, the scripts typically run on the host: use `MONGO_URI` with `localhost` and the app user. For Atlas, set `MONGO_URI` to the Atlas URI.
- **Credentials:** Ensure `MONGO_APP_USER` and `MONGO_APP_PASSWORD` (or the user in `MONGO_URI`) have read/write access to the `capstone_project` database. See [deploy/backup.sh](../../deploy/backup.sh) and [deploy/restore.sh](../../deploy/restore.sh).
