# Local Deployment

Running the Capstone stack on your machine for development.

## Quick start

```bash
./start.sh
```

This starts all Docker services (MongoDB, Ganache, IPFS, auth, business, admin, audit), then the web dev server, and can open browser tabs when ready.

**Stop:**

```bash
./stop.sh
```

**Restart and reopen tabs:**

```bash
./restart.sh
```

**If Docker is already running, only open browser tabs:**

```bash
./scripts/open-services.sh
```

## start.sh flags

You can combine some flags; **`--production` cannot be used with `--dev` or `--clean`**.

| Flag | Short | Description |
|------|--------|-------------|
| `--dev` | `-d` | Development mode: auto-reload, FAB and prefill on login. |
| `--demo` | `-D` | Security demo on **4173**: production build, no FAB/prefill; same backend APIs. |
| `--demo-ui` | — | Demo UI on **5173**: dev server, hot reload, no FAB/prefill; same backend APIs. |
| `--production` | `-p` | Full reset: remove all containers and volumes, then start. DB is **empty**. |
| `--clean` | — | Clean unused Docker resources before starting. |
| `--status` | — | Show what’s running and disk usage; do not start anything. |
| `--test` | `-t` | Run all tests (backend, web, blockchain). |
| `--skip-ipfs` | — | Skip IPFS (use when the IPFS container fails). |
| `--slow-network` | `-s` | Use longer wait times for service startup (e.g. Codespaces or slow networks). |
| `--atlas` | `-a` | Use MongoDB Atlas instead of local MongoDB; set `MONGO_URI` in `.env`. See [atlas.md](atlas.md). |

**Examples:**

- `./start.sh --dev` — full dev on 5173 (FAB, prefill, auto-reload).
- `./start.sh --demo-ui` — demo UI on 5173 (hot reload, no FAB/prefill).
- `./start.sh --production` — tear down everything (including DB), then start fresh.
- `./start.sh --clean --dev` — clean Docker, then start in dev mode.
- `./start.sh --atlas` — use Atlas for MongoDB (no local MongoDB container).

## Manual Docker start

If you prefer not to use the start script:

```bash
docker-compose up -d
```

Then optionally open browser tabs:

```bash
./scripts/open-services.sh
```

To run the web frontend locally (e.g. with hot reload), from project root:

```bash
cd web && npm install && npm run dev
```

## Ports

| Port | Service |
|------|---------|
| 5173 | Vite dev server (proxy to APIs) |
| 4173 | Vite preview (static build; API calls to 3001–3004) |
| 3001 | Auth service |
| 3002 | Business service |
| 3003 | Admin service |
| 3004 | Audit service |
| 27017 | MongoDB |
| 7545 | Ganache (RPC) |
| 5001 | IPFS API |
| 8080 | IPFS Gateway |

## Required .env variables (local)

At project root, copy [.env.example](../../.env.example) to `.env` and set at least:

- **Database:** `MONGO_ROOT_USER`, `MONGO_ROOT_PASSWORD`, `MONGO_APP_USER`, `MONGO_APP_PASSWORD` (defaults in .env.example work for local Docker). Or `MONGO_URI` if using Atlas (see [atlas.md](atlas.md)).
- **Services:** `AUTH_SERVICE_PORT`, `BUSINESS_SERVICE_PORT`, `ADMIN_SERVICE_PORT`, `AUDIT_SERVICE_PORT` (defaults 3001–3004).
- **Service URLs:** `AUTH_SERVICE_URL`, `BUSINESS_SERVICE_URL`, etc. (for inter-service calls; use `http://localhost:3001` etc. when running on host).
- **Security:** `JWT_SECRET` (use a strong value; change in production).
- **CORS:** `CORS_ORIGIN=http://localhost:5173` (or the origin your browser uses).

Optional for local:

- **Email:** `EMAIL_API_KEY`, `DEFAULT_FROM_EMAIL` — if set, real verification emails are sent; otherwise mock sender (code in logs / on screen in --dev).
- **Seeding:** `SEED_DEV=true`, `SEED_FORM_DEFINITIONS=true`, `SEED_TEMP_PASSWORD` — seed dev users and form definitions.
- **Rate limits:** `DISABLE_RATE_LIMIT=true` — dev only; disables login/signup rate limits.

Docker Compose also uses `DOCKER_*` URLs for container-to-container communication; see .env.example.
