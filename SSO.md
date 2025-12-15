# SSO: Google OAuth Setup

## Overview
- Implements “Continue with Google” on mobile and verifies Google users on the backend.
- Uses Web client ID as `serverClientId` and Android client ID on device.
- MFA behavior:
  - After Google sign‑in: if TOTP authenticator is enabled, the Two‑Factor screen is shown.
  - After biometrics login: TOTP is skipped (biometric success is treated as second factor).

## Prerequisites
- Google Cloud project with OAuth client IDs: Web and Android.
- Mobile app configured with `google_sign_in` and `.env`.
- Backend configured with `google-auth-library` and `.env`.

## OAuth Client IDs
- Web client ID (used for ID token audience verification):
  - `GOOGLE_SERVER_CLIENT_ID` and `GOOGLE_CLIENT_ID` in both mobile and backend `.env`.
- Android client ID (used by Google Play Services on device):
  - `GOOGLE_ANDROID_CLIENT_ID` in mobile `.env`.

Example (`mobile/app/.env`):
```
GOOGLE_SERVER_CLIENT_ID=146767537658-ig1s62nfuddjj3j2r7it5nb9e207hv1q.apps.googleusercontent.com
GOOGLE_CLIENT_ID=146767537658-ig1s62nfuddjj3j2r7it5nb9e207hv1q.apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=146767537658-3gtn7f5fifqvejip4hlkq5kp33hoa3k0.apps.googleusercontent.com
```

Example (`backend/.env`):
```
GOOGLE_SERVER_CLIENT_ID=146767537658-ig1s62nfuddjj3j2r7it5nb9e207hv1q.apps.googleusercontent.com
GOOGLE_CLIENT_ID=146767537658-ig1s62nfuddjj3j2r7it5nb9e207hv1q.apps.googleusercontent.com
```

## Android Signing and Identity
- Package name: `com.yourorg.capstone` (`mobile/app/android/app/build.gradle.kts`).
- Shared keystore enforced for app variants:
  - `debug`, `release`, and `profile` use `teamDebug` signing.
  - `debugAndroidTest` mirrors the shared keystore.
- Verify identity:
  - Run `./gradlew.bat signingReport -q` in `mobile/app/android`.
  - Confirm SHA‑1 matches the Android OAuth client’s fingerprint.
  - Expected SHA‑1: `12:81:F3:AE:5D:F9:33:52:4B:9C:DF:E6:78:38:15:E4:41:26:E1:A0`.
- Google Cloud Console:
  - Delete any Android OAuth client using old SHA‑1 (e.g., `6F:F3:F5:...`).
  - Ensure Android client entry matches package `com.yourorg.capstone` and the expected SHA‑1.

## Mobile Configuration
- `GoogleSignIn` setup (`mobile/app/lib/data/services/google_auth_service.dart`):
  - `serverClientId` from Web client ID.
  - `clientId` from `GOOGLE_ANDROID_CLIENT_ID` on Android.
- Login flow (`mobile/app/lib/presentation/screens/login_page.dart`):
  - On Google sign‑in success, app calls backend and then checks MFA status.
  - If authenticator is enabled, navigates to the Two‑Factor screen.
  - If login was via biometrics, skips TOTP and proceeds to profile.

## Backend Configuration
- Token verification (`backend/src/routes/auth/login.js`):
  - Verifies `idToken` with `audience: GOOGLE_SERVER_CLIENT_ID` when provided.
  - Extracts names from token payload when available.
  - Creates/updates user; returns profile JSON.
- MFA endpoints:
  - `POST /api/auth/login/verify-totp` to verify TOTP during login.
  - Fingerprint login start/complete endpoints for biometric flow.

## Consent Screen
- If consent screen is “Testing”, add your account as a test user.
- Or publish the consent screen for broader access.
- Scopes used: `email`, `profile` (standard; no special verification needed).

## Testing Checklist
- `flutter analyze` reports no issues.
- `./gradlew signingReport` shows expected SHA‑1 for app variants.
- Google sign‑in:
  - With TOTP enabled: Two‑Factor screen appears and verifies successfully.
  - With biometrics login: TOTP prompt is skipped after successful device auth.
- Backend accepts and verifies tokens, returns correct profile data.

## Troubleshooting
- `ApiException: 10` on Android:
  - Android OAuth client does not match package + SHA‑1. Fix in Cloud Console.
- “Consent required”:
  - Add test users or publish the consent screen.
- `invalid_audience`:
  - Backend `.env` must use the Web client ID as audience.

## Security Notes
- Do not commit secrets. Keep client IDs in `.env` or secrets manager.
- Enable rate limiting in production and secure consent screen and domains.
