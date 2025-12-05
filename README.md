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

- `backend/` Node.js Express API
- `mobile/` Flutter application

## Backend Setup (Windows)

- Prerequisites:
  - `Node.js` 18+ and `npm`
  - `MongoDB` running locally (`mongodb://localhost:27017`)
- Install dependencies:
  - `cd backend`
  - `npm install`
- Environment config:
  - `backend/.env` is required.
  - Local development (preferred):
    - `MONGODB_URI=mongodb://localhost:27017/capstone_project`
    - `JWT_SECRET=<any strong secret>`
    - `PORT=3000`
  - Hosting/production: ask Pen for `.env` details (Atlas connection string and production secrets).
- Start dev server:
  - `npm run dev`
  - Expected logs: `🚀 Server is running on http://0.0.0.0:3000` and `✅ Connected to MongoDB`

## Mobile Setup (Flutter)

- Prerequisites:
  - Flutter SDK and a connected device/emulator
  - Phone and PC on the same Wi‑Fi when testing on a physical device
- Configure API base URL:
  - Physical device: set the server PC’s LAN IPv4 and port `3000`
  - File: `mobile/app/lib/mongodb_service.dart:6`
  - Example: `static const String baseUrl = 'http://192.168.1.38:3000';`
- Install and run:
  - `cd mobile/app`
  - `flutter pub get`
  - `flutter run`

## macOS Setup

- Prerequisites:
  - Xcode (for iOS simulator/physical device)
  - Homebrew (package manager)
  - Node.js and npm
  - MongoDB Community Server

- Install dependencies via Homebrew:
  - `brew install node`
  - `brew tap mongodb/brew`
  - `brew install mongodb-community@6.0`
  - Start MongoDB: `brew services start mongodb-community@6.0`

- Backend:
  - `cd backend`
  - `npm install`
  - Create/edit `.env`:
    - `MONGODB_URI=mongodb://localhost:27017/capstone_project`
    - `JWT_SECRET=<any strong secret>`
    - `PORT=3000`
  - Run dev server: `npm run dev`
- Verify: open `http://localhost:3000/` and expect JSON health message

## Local Web Frontend (Vite React)

- Prerequisites:
  - Node.js 18+ and npm
- Install and run:
  - `cd web`
  - `npm install`
  - Create `.env.local` and set:
    - `VITE_BACKEND_ORIGIN=http://localhost:3000` (or use the hosted backend URL)
  - `npm run dev`
- How requests work:
  - The frontend calls relative paths first; if the request fails, it falls back to `VITE_BACKEND_ORIGIN` (`web/src/lib/http.js`).
  - For local dev, ensure the backend dev server is running on `3000`.

## Hosted Environment (Render + Atlas + Vercel)

- Backend (Render):
  - Web Service: root directory `backend`, start command `npm run start`.
  - Environment: set `MONGODB_URI` (Atlas), `JWT_SECRET` (ask Pen), `PORT` optional.
  - Health: `GET /` returns JSON; logs show `✅ Connected to MongoDB`.
- Frontend (Vercel):
  - Project root: `web`, build command `npm run build`, output `dist`.
  - Environment: set `VITE_BACKEND_ORIGIN=https://<render-backend-url>`.
  - Visit the Vercel URL and verify login/profile flows.
- CORS:
  - During initial testing, backend allows all origins.
  - After frontend is live, restrict backend CORS to your Vercel domain.

## Quick Smoke Tests

- Backend (hosted):
  - Health: `curl -s https://<render-backend-url>/ | jq`
  - Signup: `curl -sX POST https://<render-backend-url>/api/auth/signup -H "Content-Type: application/json" -d '{"firstName":"Test","lastName":"User","email":"test@example.com","phoneNumber":"+1-555-0000","password":"password123","confirmPassword":"password123"}' | jq`
  - Login: `TOKEN=$(curl -sX POST https://<render-backend-url>/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"password123"}' | jq -r '.token')`
  - Profile: `curl -s https://<render-backend-url>/api/user/profile -H "Authorization: Bearer $TOKEN" | jq` (no angle brackets around the token)

- Find your Mac’s LAN IP (for physical devices):
  - `ipconfig getifaddr en0` (Wi‑Fi) or `ipconfig getifaddr en1` depending on interface
  - Example result: `192.168.1.50`

- Configure mobile base URL:
  - File: `mobile/app/lib/mongodb_service.dart:6`
  - Set: `static const String baseUrl = 'http://<Mac-IP>:3000';`
  - For Android emulator on macOS: use `http://10.0.2.2:3000`

- Flutter app:
  - `cd mobile/app`
  - `flutter pub get`
  - iOS simulator: `flutter run -d ios`
  - Android emulator: `flutter run -d android`
  - Physical iOS device:
    - Build and run from Xcode or `flutter run -d ios`
  - Physical Android device:
    - Ensure device and Mac are on the same Wi‑Fi, USB debugging enabled
    - Use `http://<Mac-IP>:3000` in base URL

- Firewall and permissions:
  - Allow Node.js to accept incoming network connections when macOS prompts
  - If port conflicts occur: `lsof -i :3000` then kill the conflicting PID

## Features Implemented

- Authentication
  - Login: `backend/server.js:119–176`
  - Sign Up: `backend/server.js:41–116`
- Profile
  - View profile: `backend/server.js:185–213`
  - Edit profile: `backend/server.js:214–258`
  - Change password: `backend/server.js:259–296`
  - Delete account: `backend/server.js:297–326`
- Mobile UI
  - Login screen → navigates to profile on success: `mobile/app/lib/login_page.dart:43–53`
  - Profile screen shows Email, First Name, Last Name, Phone, and actions: `mobile/app/lib/profile.dart:343–368`, `mobile/app/lib/profile.dart:409–453`
  - Separate logout card and confirmation: `mobile/app/lib/profile.dart:335–337`, `mobile/app/lib/profile.dart:454–479`, `mobile/app/lib/profile.dart:262–287`

## API Endpoints

- `POST /api/auth/signup`
  - Body: `{ firstName, lastName, email, phoneNumber, password, confirmPassword }`
  - Returns: `201` with `user` details
- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Returns: `200` with `token` and `user`
- `GET /api/user/profile` (JWT)
  - Header: `Authorization: Bearer <token>`
  - Returns: `200` with `user`
- `PUT /api/user/profile` (JWT)
  - Body: `{ firstName, lastName, phoneNumber }`
  - Returns: `200` with updated `user`
- `PUT /api/user/password` (JWT)
  - Body: `{ currentPassword, newPassword }`
  - Returns: `200` on success
- `DELETE /api/user/account` (JWT)
  - Body: `{ password }`
  - Returns: `200` on successful deletion

## Mobile Client Calls

- Base URL: `mobile/app/lib/mongodb_service.dart:6`
- Sign Up: `mobile/app/lib/mongodb_service.dart:17–55`
- Login: `mobile/app/lib/mongodb_service.dart:70–124`
- Update Profile: `mobile/app/lib/mongodb_service.dart:101–150`
- Update Password: `mobile/app/lib/mongodb_service.dart:151–196`
- Delete Account: `mobile/app/lib/mongodb_service.dart:197–240`

## Troubleshooting

- Timeouts from mobile:
  - Ensure phone and PC are on the same network
  - Confirm firewall allows inbound connections on the chosen port
  - Verify backend is reachable via PC browser: `http://<PC-IP>:3000/`
- Port conflicts:
  - If `EADDRINUSE` appears, stop the process using the port and restart `npm run dev`
- Emulator vs physical device:
  - Emulator (Android) typically uses `http://10.0.2.2:<port>`
  - Physical device uses your PC’s LAN IPv4

## Notes

- Email is non-editable in the profile UI.
- Password changes require the current password and are hashed with `bcryptjs` on the backend.
