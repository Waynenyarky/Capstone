# MFA (Multi-Factor Authentication) — Frontend docs

This document describes the MFA-related frontend work in this repository: what is implemented in the web app, how the frontend integrates with backend endpoints, developer/demo options, and how to run tests and manual checks.

---

## Overview

- Purpose: support Email OTP (second step) and TOTP (authenticator apps) flows in the frontend UI. Backend is expected to implement secure OTP/TOTP generation, verification, TTL, and storage.
- Scope: Frontend-only documentation. The server remains the source of truth for secrets and verification.

## What the frontend implements

- Login flow integration
  - `web/src/features/authentication/hooks/useLogin.js` and `useLoginFlow.js` orchestrate the multi-step flow.
  - The frontend calls `/api/auth/login/start` (via `loginStart`) to begin login and then shows a verification form when needed.

- Email OTP (verification UI)
  - `web/src/features/authentication/components/LoginVerificationForm.jsx` — verification form and resend button.
  - `web/src/features/authentication/hooks/useLoginVerificationForm.js` — handles verify call and user-visible errors.
  - `web/src/features/authentication/hooks/useResendLoginCode.js` & `useCooldown.js` — resend API calls and cooldown UI.

- TOTP (Authenticator apps)
  - `web/src/pages/MfaSetup.jsx` — requests TOTP setup (returns `otpauth` URI + secret), shows QR (via `QrDisplay`) and verifies the code to enable MFA.
  - `web/src/features/authentication/components/TotpVerificationForm.jsx` — used for login verification when TOTP is enabled.
  - `web/src/features/authentication/components/QrDisplay.jsx` — renders QR using the `qrcode` package.

- Account management
  - `web/src/features/authentication/components/LoggedInMfaManager.jsx` — account settings UI to open setup/disable MFA.

- Services
  - `web/src/features/authentication/services/mfaService.js` — wrapper functions for `/api/auth/mfa/*` endpoints.
  - `web/src/features/authentication/services/authService.js` — login/start/verify wrappers.

- Tests
  - Basic snapshot tests exist under `web/src/__tests__/mfa.ui.test.jsx` (vitest snapshots). These are intended to capture UI structure for regression checks.

## What the backend must (and should) do

The frontend relies on the backend for secure operations. Backend responsibilities include:

- Generate 6-digit OTPs, enforce TTL (3–5 minutes), store single-use OTPs and delete/mark consumed on verify.
- Send email OTPs via a secure provider (SendGrid, SES, Mailgun) — API keys must never be placed in the frontend.
- Rate-limit OTP send and verify endpoints per email and per IP to prevent brute-force attacks.
- Generate and persist TOTP shared secrets securely (server-side) and verify TOTP tokens — ideally store encrypted with a server-side key.
- Enforce MFA during login when enabled (return `mfa_required` from `/login` and validate the second step before issuing session tokens).

If you have a working backend already, the frontend will call it directly (no extra backend changes are necessary if endpoints exist and conform to the expected shapes).

## Developer notes

- Dev-code exposure: servers commonly return a `devCode` during development. The frontend shows this (via notifier) so developers can test verify flows.

Note: The frontend no longer provides an offline/demo OTP fallback — the app always calls the backend for OTP generation and verification. Ensure the backend is reachable in your dev environment when testing MFA flows.

## How to run the frontend and tests

Run the frontend dev server (PowerShell example):

```powershell
cd "C:\Users\Keane\Desktop\Git Uploads\Capstone\web"
npm install
npm run dev
```

Run snapshot tests:

```powershell
cd "C:\Users\Keane\Desktop\Git Uploads\Capstone\web"
npm install
npm run test
```

Notes:
- Tests use Vitest and `react-test-renderer` for basic snapshots. If you prefer `@testing-library/react`, the tests can be migrated.

## Security notes and recommendations

- Do NOT implement OTP/TOTP generation or secret persistence purely on the frontend for real users — this is insecure.
- Keep provider API keys on the server only; the frontend must never embed secret keys.
- Store TOTP secrets on the server encrypted with a server-managed key; use a proper KMS or environment-protected key if available.
- Use server-side rate limiting and account lockout strategies to reduce brute-force risk.
- For WebAuthn/passkey support, implement both frontend `navigator.credentials` flows and the corresponding server endpoints for challenge/verification — WebAuthn cannot be securely implemented frontend-only.

## Where to look in the code

- Login flow & verification hooks: `web/src/features/authentication/hooks/`
- Verification and setup components: `web/src/features/authentication/components/` and `web/src/pages/MfaSetup.jsx`
- Service wrappers: `web/src/features/authentication/services/`
- Tests: `web/src/__tests__/`

---

If you want, I can add a small developer banner that shows when backend is unreachable or when demo mode is enabled, and link to this README. I can also expand this document into `web/docs/` with separate API expectations for backend responses.
