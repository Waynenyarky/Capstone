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

See [QUICK_START.md](QUICK_START.md) for more details.

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

See [DOCKER_DEPLOY.md](DOCKER_DEPLOY.md) for detailed deployment instructions.

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

## Documentation

- **Deployment**: [DOCKER_DEPLOY.md](DOCKER_DEPLOY.md) - Docker deployment guide
- **Backend**: [BACKEND_README.md](BACKEND_README.md) - Backend architecture and API documentation
- **Blockchain**: [Blockchain.md](Blockchain.md) - Blockchain integration documentation
- **Features**:
  - [2FA_SETUP.md](2FA_SETUP.md) - Two-factor authentication setup
  - [BIOMETRICS.md](BIOMETRICS.md) - Biometric authentication
  - [SSO.md](SSO.md) - Single Sign-On (Google OAuth)
