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

### Browsing files from application submissions (prefill / new application)

When users submit a new business application (including with prefill test data), uploaded documents (ID picture, CTC, barangay clearance, BIR certs, etc.) are stored in IPFS. To **browse** those files:

1. **From the app (LGU / Admin)**  
   Log in as an LGU officer or admin → open **Applications** → select the submitted application. The **Documents** section shows each file with **View** / **View PDF**; those links open the IPFS gateway URL for the stored CID.

2. **List all application IPFS files from the command line**  
   From the project root:
   ```bash
   node backend/services/business-service/scripts/browseApplicationIpfs.js
   ```
   This prints each document’s **CID** and **gateway URL**. Open the URL in a browser to view the file (e.g. `http://localhost:8080/ipfs/<CID>`). Options:
   - `--application=WI-xxx` — only list documents for applications whose reference contains `WI-xxx`.
   - `--pins` — also list all pinned CIDs on the IPFS node.

3. **Gateway URL**  
   Default gateway: `http://localhost:8080/ipfs/` (set `IPFS_GATEWAY_URL` in `.env` if you use another gateway). Ensure the IPFS container is running so the gateway can serve the content.

4. **Auth-service IPFS files (avatars, profile JSON)**  
   To list avatars and profile JSON stored in IPFS:
   ```bash
   node backend/services/auth-service/scripts/browseIpfs.js
   node backend/services/auth-service/scripts/browseIpfs.js --user=email@example.com
   node backend/services/auth-service/scripts/browseIpfs.js --cid=QmXxx...
   ```

---

## Auth / login

### Verification email not received

- **Mailinator / disposable inbox:** Delivery can be delayed or unreliable. Check spam; wait a few minutes.
- **Development shortcut:** Use `./start.sh --dev`. On the login verification screen you’ll see **"Development: your code is XXXXXX"** — enter that code without checking email.
- **Mock sender:** If `EMAIL_API_KEY` is not set (and not production), the auth-service uses a mock sender: the code is only in **auth-service logs** (e.g. `docker logs capstone-auth-service`) or on the verification screen in --dev. Set `EMAIL_API_KEY`, `EMAIL_API_PROVIDER` (e.g. resend), and `DEFAULT_FROM_EMAIL` in **project root** `.env` for real email; ensure the sender is verified in your provider (e.g. Resend: use onboarding@resend.dev for no domain).

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

## Blockchain (audit logging)

### "insufficient funds for gas * price + value" when logging audit hashes

The audit-service logs audit event hashes to the blockchain (Ganache) using the account derived from **`DEPLOYER_PRIVATE_KEY`**. Each `logAuditHash` transaction costs gas; if that account runs out of ETH, you see:

- `Error logging audit hash to blockchain: insufficient funds for gas * price + value`
- `Blockchain operation failed after 3 retries`

**Fix:**

1. **Identify the auditor account**  
   In audit-service logs at startup you should see: `Account: 0x...` and `Balance: X.XXX ETH`. That address is the one that must have ETH.

2. **Fund the account (Ganache)**  
   - **Option A – Restart Ganache with a clean state**  
     If using Docker Ganache, restart the stack so Ganache starts with fresh pre-funded accounts. Ensure `DEPLOYER_PRIVATE_KEY` in `.env` matches Ganache’s first account (e.g. mnemonic `test test test test test test test test test test test junk`).  
   - **Option B – Send ETH from another Ganache account**  
     In Ganache UI, send ETH from any other account that has balance to the auditor address shown in the logs.  
   - **Option C – Use a different key**  
     In Ganache, copy the private key of an account that still has ETH and set `DEPLOYER_PRIVATE_KEY` to that value in `.env`. Restart audit-service.  
     **Note:** That account must have **AUDITOR_ROLE** on the AuditLog contract; if you use a different key, re-grant the role or redeploy contracts so the new account is the auditor.

3. **Restart audit-service**  
   After changing `.env` or funding:  
   `docker compose restart audit-service`  
   (or restart however you run the service).

Audit logs are still created in MongoDB; only the on-chain hash logging fails when the account has no ETH. Once the account is funded, new audit events will log to the blockchain again (existing failed ones are not automatically retried).

### "caller does not have AUDITOR_ROLE" when logging audit hashes

The AuditLog contract only allows accounts that have **AUDITOR_ROLE** on the AccessControl contract to log hashes. The audit-service signs transactions with the account from **`DEPLOYER_PRIVATE_KEY`**; that address must have AUDITOR_ROLE.

**If your .env contract addresses are from an old Ganache** (e.g. you restarted Ganache or use a new workspace), redeploy so the addresses match the **current** chain, then grant the role:

1. **Start your current Ganache** (GUI on port 7545, or Docker with 7545 mapped).
2. **Set `DEPLOYER_PRIVATE_KEY` in `.env`** to Account 0’s private key from Ganache.
3. **Run one command:**
   ```bash
   cd blockchain && npm run setup
   ```
   Or from project root: **`./start.sh --ganache-gui`** (it runs setup for you).
   See **blockchain/README.md** for the full “after you restart Ganache” flow.
4. **Restart audit-service** if needed: `docker compose restart audit-service`.

**If the contract addresses in .env already match the current chain**, only grant the role:

1. **Ensure contracts are deployed**  
   Deploy (or redeploy) with Ganache running:  
   `cd blockchain && npx truffle migrate --network development`

2. **Grant roles to the audit-service account**  
   From the **project root** (so `.env` with `DEPLOYER_PRIVATE_KEY` and `GANACHE_RPC_URL` is loaded), run:  
   ```bash
   cd blockchain && npm install && node GRANT_ROLES.js
   ```  
   - **Docker:** The audit-service talks to Ganache at `http://ganache:8545`; the host sees it as **port 7545** (see docker-compose port mapping). So in `.env` set `GANACHE_RPC_URL=http://127.0.0.1:7545` so the script hits the **same** Ganache. Ensure `ACCESS_CONTROL_CONTRACT_ADDRESS` (and other contract addresses) are in `.env` — they are written there by the `deploy-contracts` container after migrations. The script uses that address so it grants on the same contract the audit-service uses.  
   - Granting is done by the contract owner (first Ganache account). The script grants AUDITOR_ROLE to the address derived from `DEPLOYER_PRIVATE_KEY` (the same key the audit-service uses).

3. **Restart audit-service**  
   `docker compose restart audit-service` (or restart however you run the service).

If you use a **different** private key in `.env` than the one used to deploy (e.g. a second Ganache account), run `GRANT_ROLES.js` after every fresh deploy so that key’s address gets AUDITOR_ROLE.

---

## Backup / restore scripts

### backup.sh or restore.sh fails

- **Encrypted backups (`.archive.enc`):** Restore requires **`BACKUP_ENCRYPTION_PASSWORD`** set in `.env` (or environment) to match the password used when the backup was created. If it’s missing or wrong, decryption fails.
- **MongoDB reachable:** Backup and restore need to connect to MongoDB. For local Docker, the scripts typically run on the host: use `MONGO_URI` with `localhost` and the app user. For Atlas, set `MONGO_URI` to the Atlas URI.
- **Credentials:** Ensure `MONGO_APP_USER` and `MONGO_APP_PASSWORD` (or the user in `MONGO_URI`) have read/write access to the `capstone_project` database. See [deploy/backup.sh](../../deploy/backup.sh) and [deploy/restore.sh](../../deploy/restore.sh).
