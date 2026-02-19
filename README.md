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

**Ports:** **5173** = Vite dev server (proxy to APIs). **4173** = Vite preview (static build; API calls go to 3001–3004). **Both are connected to the same backend.**

**Examples:**
- `./start.sh --demo` — security demo on **4173** (production build, no dev UI). **Use for presentations.**
- `./start.sh --demo-ui` — demo UI on **5173** (hot reload, no FAB/prefill).
- `./start.sh --dev` — full dev on 5173 (FAB, prefill, auto-reload).
- `./start.sh --production` — tear down everything (including DB), then start fresh (still dev server; for a demo after reset, run `./start.sh --demo` next).
- `./start.sh --clean --dev` — clean Docker, then start in dev mode (cannot use `--clean` with `--production`).

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

- **Temporary emails**: Use [Mailinator](https://www.mailinator.com) addresses (e.g. `anything@mailinator.com`) to receive OTPs when testing signup, login, or password reset. Read mail at mailinator.com by entering the part before `@`.
- **Five role accounts (LGU Officer, Manager, Admin, Admin 2, Admin 3)**  
  - **Production / demo mode** (`./start.sh --demo`): The seed **always** uses Mailinator addresses for these roles (no `admin@example.com`). Defaults are `bizclear-officer@mailinator.com`, `bizclear-admin@mailinator.com`, etc. You can override them in `.env` (see below). Log in with those emails and `SEED_TEMP_PASSWORD` (default `TempPass123!`); read OTPs at [mailinator.com](https://www.mailinator.com).
  - **Development**: To use Mailinator in dev too, add these to the **project root** `.env` (same folder as `docker-compose.yml`):
  ```bash
  DEV_EMAIL_OFFICER=bizclear-officer@mailinator.com
  DEV_EMAIL_MANAGER=bizclear-manager@mailinator.com
  DEV_EMAIL_ADMIN=bizclear-admin@mailinator.com
  DEV_EMAIL_ADMIN2=bizclear-admin2@mailinator.com
  DEV_EMAIL_ADMIN3=bizclear-admin3@mailinator.com
  ```
  Then **restart the stack** so the seed runs: `./stop.sh` then `./start.sh` (or `./start.sh --dev`), or `docker-compose up -d --force-recreate auth-service`.
  - Log in at **http://localhost:5173** (dev) or **http://localhost:4173** (demo) with the seeded email and `SEED_TEMP_PASSWORD`. Read OTPs at [mailinator.com](https://www.mailinator.com) (inbox: e.g. `bizclear-admin`).
- **Generate test addresses**: `node backend/scripts/generate-test-email.js` (one-off address) or `node backend/scripts/generate-test-email.js roles` (print the five role emails and `.env` snippet).

**Getting 401 Unauthorized or “Invalid email or password” with Mailinator emails?**

1. **Confirm default accounts work** – Try **admin@example.com** with password **TempPass123!** (include the `!`). If that works, the backend is fine and the Mailinator users were not seeded.
2. **Recreate the auth container** so it picks up your `.env` and re-runs the seed:
   ```bash
   docker-compose up -d --force-recreate auth-service
   ```
   Wait ~10 seconds, then try **bizclear-admin@mailinator.com** again with **TempPass123!**.
3. **Check password** – Use exactly **TempPass123!** (capital T, P, and the exclamation mark). Or set `SEED_TEMP_PASSWORD` in `.env` and use that value after recreating the auth-service.
