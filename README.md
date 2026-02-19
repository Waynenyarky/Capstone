# Capstone

## Overview

- Full-stack Flutter + Node.js/Express + MongoDB project.
- Implements authentication and user profile management with the following flows:
  - Sign Up and Login with JWT
  - View Profile (Email, First Name, Last Name, Phone Number)
  - Edit Profile (updates backend)
  - Change Password (verifies current, updates backend)
  - Delete Account (password-confirmed, permanent)
  - Logout (returns to Login, clears navigation stack)

## Repository Structure

- `backend/` Node.js Express API (microservices architecture)
- `mobile/` Flutter application
- `web/` React Web
- `blockchain/` Smart contracts (Truffle Suite)
- `ai/` AI/ML services

## 🚀 Quick Start - One Command!

**Easiest way to start everything and open browser tabs automatically:**

```bash
./start.sh
```

This will:
- ✅ Start all Docker services (MongoDB, IPFS, Ganache, APIs)
- ✅ Automatically open browser tabs for IPFS Gateway, MongoDB info, and APIs
- ✅ No commands to remember!

**To stop everything:**
```bash
./stop.sh
```

**To restart and reopen browser tabs:**
```bash
./restart.sh
```

**Or if Docker is already running, just open browser tabs:**
```bash
./scripts/open-services.sh
```

### `./start.sh` flags

`./start.sh` supports these flags (you can combine some; **`--production` cannot be used with `--dev` or `--clean`**):

| Flag | Short | Description |
|------|--------|-------------|
| `--demo` | `-D` | **Security demo (4173)**: production build, no FAB/prefill, Mailinator seeds. **Uses same backend APIs** (auth 3001, etc.) — frontend is pre-built only. |
| `--demo-ui` | — | **Demo UI (5173)**: dev server with hot reload but no FAB/prefill. Same backend APIs; clean demo look. |
| `--production` | `-p` | **Full reset**: remove all containers and volumes, then start. DB is **empty**. Does not enable demo mode (still uses dev server and default seeds). |
| `--dev` | `-d` | Development mode (auto-reload, FAB and prefill on login). |
| `--clean` | — | Clean unused Docker resources (and optionally rebuild) before starting. |
| `--status` | — | Show what’s running and disk usage; do not start anything. |
| `--test` | `-t` | Run all tests (backend, web, blockchain). |
| `--skip-ipfs` | — | Skip IPFS (use when the IPFS container fails). |
| `--slow-network` | `-s` | Use longer wait times for service startup (for slow or high-latency networks). |

**Ports:** **5173** = Vite dev server (proxy to APIs). **4173** = Vite preview (static build; API calls go to 3001–3004). **Both are connected to the same backend.**

**Testing login without email:** Mailinator (and other disposable inboxes) can be slow or unreliable; some providers accept the send but delivery never appears. In **development** (when not using `--demo-ui`), the login verification screen shows **"Development: your code is XXXXXX"** so you can enter the code without checking email. Use `./start.sh --dev` to get the dev code on the verification step.

**Examples:**
- `./start.sh --demo` — security demo on **4173** (production build, no dev UI). **Use for presentations.**
- `./start.sh --demo-ui` — demo UI on **5173** (hot reload, no FAB/prefill).
- `./start.sh --dev` — full dev on 5173 (FAB, prefill, auto-reload).
- `./start.sh --production` — tear down everything (including DB), then start fresh (still dev server; for a demo after reset, run `./start.sh --demo` next).
- `./start.sh --clean --dev` — clean Docker, then start in dev mode (cannot use `--clean` with `--production`).
- `./start.sh --slow-network` or `./start.sh -s` — use longer waits (e.g. on slow networks or Codespaces).

---

## Quick Start - Docker Deployment (Manual)

If you prefer to start manually:

```bash
docker-compose up -d
```

This will automatically:
- Start MongoDB, Ganache (blockchain), and IPFS
- Deploy smart contracts
- Start all microservices (Auth, Business, Admin, Audit)

**Database (MongoDB):** MongoDB runs with authentication (IAS-3.7). Copy [.env.example](.env.example) to `.env` and set `MONGO_ROOT_USER`, `MONGO_ROOT_PASSWORD`, `MONGO_APP_USER`, `MONGO_APP_PASSWORD` (defaults work for local dev; change in production). Optional: set `BACKUP_ENCRYPTION_PASSWORD` so [deploy/backup.sh](deploy/backup.sh) produces encrypted backups. See [docs/security-database.md](docs/security-database.md).

## Manual Setup

### Backend Setup (Windows & MacOS)

- Find your Mac's LAN IP (for physical devices):
  - `ipconfig getifaddr en0` (Wi‑Fi) or `ipconfig getifaddr en1` depending on interface
  - Example result: `192.168.1.50`
- Prerequisites:
  - `Node.js` and `npm`
  - `MongoDB`
- Installation Instructions:
  - `cd backend/services`
  - `npm run install:all`
- Environment config:
  - Each service requires a `.env` file (see `backend/services/.env.example`)
  - Local development:
    - `MONGO_URI=mongodb://localhost:27017/capstone_project`
    - `JWT_SECRET=<any strong secret>`
  - Hosting/production: ask Pen for `.env` details (Atlas connection string and production secrets).
- Start services:
  - `npm start` (starts all microservices)
  - Expected logs: Services listening on ports 3001, 3002, 3003, 3004

### Mobile Setup (Flutter)

- Prerequisites:
  - Flutter SDK and a connected device/emulator
  - Phone and PC on the same Wi‑Fi when testing on a physical device
- Configure API base URL:
  - Physical device: set the server PC's LAN IPv4 and port `3001` (Auth Service)
  - File: `mobile/app/.env`
  - Example: `BASE_URL=http://192.168.1.38:3001`
- Install and run:
  - `cd mobile/app`
  - `flutter pub get`
  - `flutter run`

### Local Web Frontend (Vite React)

- Prerequisites:
  - Node.js and npm
- Install and run:
  - `cd web`
  - `npm install`
  - Create `.env.local` and set:
    - `VITE_BACKEND_ORIGIN=http://localhost:3001` (or use the hosted backend URL, get details from Pen)
  - `npm run dev`

## Testing and temporary emails

- **Verification emails (signup / business owner registration)**  
  Signup sends a verification code via the configured email provider (default: SendGrid). If you don't receive the email:
  1. **Check the sender is verified** – `DEFAULT_FROM_EMAIL` in `.env` must be a [verified Single Sender or domain](https://docs.sendgrid.com/ui/account-and-settings/sender-auth) in SendGrid. Using an unverified address (e.g. a random Gmail) causes SendGrid to reject the send; the app will now show "Failed to send verification email" with the error instead of silently succeeding.
  2. **Development without an API key** – If `EMAIL_API_KEY` is not set and `NODE_ENV` is not `production`, a mock sender is used: no real email is sent; the code is only printed in the auth-service logs (Dozzle or `docker logs capstone-auth-service`).
  3. **Spam/junk** – Check the recipient's spam folder.

- **Temporary emails**: Use [Mailinator](https://www.mailinator.com) addresses (e.g. `anything@mailinator.com`) to receive OTPs when testing signup, login, or password reset. Read mail at mailinator.com by entering the part before `@`.
- **Five role accounts (LGU Officer, Manager, Admin, Admin 2, Admin 3)**  
  - **Production / demo mode** (`./start.sh --demo`): The seed uses the role emails from `.env` (defaults are MailSlurp addresses; see below). Log in with those emails and `SEED_TEMP_PASSWORD` (default `TempPass123!`); read OTPs in your MailSlurp (or Mailinator) inbox.
  - **Development**: To use MailSlurp (or Mailinator) in dev, add these to the **project root** `.env` (same folder as `docker-compose.yml`):
  ```bash
  DEV_EMAIL_OFFICER=39dfaab3-6daf-410b-bbea-865f8e878583@mailslurp.biz
  DEV_EMAIL_MANAGER=afb90db7-5360-4783-a444-925b22abea70@mailslurp.biz
  DEV_EMAIL_ADMIN=1a7f9616-9643-4598-af65-3b7108e740aa@mailslurp.biz
  DEV_EMAIL_ADMIN2=d7d29cd6-ccf6-4866-b7d1-bdc26dc2e89c@mailslurp.biz
  DEV_EMAIL_ADMIN3=67d7d200-da90-4dcf-8200-a513f5f19990@mailslurp.biz
  ```
  Then **restart the stack** so the seed runs: `./stop.sh` then `./start.sh` (or `./start.sh --dev`), or `docker-compose up -d --force-recreate auth-service`.
  - Log in at **http://localhost:5173** (dev) or **http://localhost:4173** (demo) with the seeded email and `SEED_TEMP_PASSWORD`. Read OTPs in your MailSlurp inbox (or at [mailinator.com](https://www.mailinator.com) if using Mailinator).
- **Generate test addresses**: `node backend/scripts/generate-test-email.js` (one-off address) or `node backend/scripts/generate-test-email.js roles` (print the five role emails and `.env` snippet).

**Getting 401 Unauthorized or “Invalid email or password” with seeded role emails?**

1. **Confirm default accounts work** – Try **admin@example.com** with password **TempPass123!** (include the `!`). If that works, the backend is fine and the role users were not seeded.
2. **Recreate the auth container** so it picks up your `.env` and re-runs the seed:
   ```bash
   docker-compose up -d --force-recreate auth-service
   ```
   Wait ~10 seconds, then try your seeded admin email again with **TempPass123!**.
3. **Check password** – Use exactly **TempPass123!** (capital T, P, and the exclamation mark). Or set `SEED_TEMP_PASSWORD` in `.env` and use that value after recreating the auth-service.

**Login OTP not arriving (e.g. MailSlurp inbox empty)?**

Check the **auth-service logs** to see what happened when you clicked “Sign in”:

```bash
docker logs capstone-auth-service 2>&1 | tail -80
```

Or use Dozzle: **http://localhost:9999** → select `capstone-auth-service` and scroll to the latest lines.

- **Email was sent (real API):**  
  You’ll see `[Email API] Attempting to send OTP to <your-email>...` then `[Email API] ✅ OTP email sent successfully to ...`. If MailSlurp still shows nothing, check that inbox’s spam/junk and that the address matches exactly (e.g. the MailSlurp inbox ID in the address).
- **Mock sender (no real email):**  
  You’ll see `⚠️ Email API key not set or still placeholder. Using mock sender` and `📧 [MOCK EMAIL] OTP Code: 123456`. So the code is only in logs; set `EMAIL_API_KEY` (and optionally `EMAIL_API_PROVIDER`, `DEFAULT_FROM_EMAIL`) in the **project root** `.env`, then restart: `docker-compose up -d --force-recreate auth-service`.
- **SendGrid/API error:**  
  You’ll see `⚠️ EMAIL API FAILED` with `To:`, `Error:`, and possibly `API Response:` / `API Status:`. Often the cause is **sender not verified**: in [SendGrid Sender Authentication](https://docs.sendgrid.com/ui/account-and-settings/sender-auth), verify the address in `DEFAULT_FROM_EMAIL` (e.g. your Gmail or a domain you own).
- **No email sent by design (TOTP):**  
  You’ll see `[Login] TOTP MFA enabled for <email> - using authenticator app, skipping email OTP`. For that account, the app uses the authenticator app only; no login OTP email is sent. Use your authenticator app, or reset MFA for that user (e.g. `node backend/scripts/reset-admin-mfa.js <email>`) and sign in again to get email OTP.
