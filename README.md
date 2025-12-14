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
- `web/` React Web

## Backend Setup (Windows & MacOS)

- Find your Mac’s LAN IP (for physical devices):
  - `ipconfig getifaddr en0` (Wi‑Fi) or `ipconfig getifaddr en1` depending on interface
  - Example result: `192.168.1.50`
- Prerequisites:
  - `Node.js` and `npm`
  - `MongoDB`
- Installation Instructions:
  - `cd backend`
  - `npm install`
- Environment config:
  - `backend/.env` is required.
  - Local development (preferred for local testing):
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
  - File: `mobile/app/.env`
  - Example: `BASE_URL=http://192.168.1.38:3000`
- Install and run:
  - `cd mobile/app`
  - `flutter pub get`
  - `flutter run`


## Local Web Frontend (Vite React)
- Prerequisites:
  - Node.js and npm
- Install and run:
  - `cd web`
  - `npm install`
  - Create `.env.local` and set:
    - `VITE_BACKEND_ORIGIN=http://localhost:3000` (or use the hosted backend URL, get details from Pen)
  - `npm run dev`

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
- `web/` React Web

## Backend Setup (Windows & MacOS)

- Find your Mac’s LAN IP (for physical devices):
  - `ipconfig getifaddr en0` (Wi‑Fi) or `ipconfig getifaddr en1` depending on interface
  - Example result: `192.168.1.50`
- Prerequisites:
  - `Node.js` and `npm`
  - `MongoDB`
- Installation Instructions:
  - `cd backend`
  - `npm install`
- Environment config:
  - `backend/.env` is required.
  - Local development (preferred for local testing):
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
  - File: `mobile/app/.env`
  - Example: `BASE_URL=http://192.168.1.38:3000`
- Install and run:
  - `cd mobile/app`
  - `flutter pub get`
  - `flutter run`


## Local Web Frontend (Vite React)
- Prerequisites:
  - Node.js and npm
- Install and run:
  - `cd web`
  - `npm install`
  - Create `.env.local` and set:
    - `VITE_BACKEND_ORIGIN=http://localhost:3000` (or use the hosted backend URL, get details from Pen)
  - `npm run dev`