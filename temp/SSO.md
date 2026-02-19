# SSO: Google OAuth Setup

## Overview
- Implements “Continue with Google” on mobile and verifies Google users on the backend.
- Uses Web client ID as `serverClientId` and Android client ID on device.
- MFA behavior:
  - After Google sign‑in: if TOTP authenticator is enabled, the Two‑Factor screen is shown.
  - After biometrics login: TOTP is skipped (biometric success is treated as second factor).

## Recent Changes
- Mobile sign‑in flows persist session and profile cache for smoother startup:
  - Saves `loggedInEmail`, `lastLoginEmail`, avatar, and basic profile so the app can render immediately after launch.
- Logout UX:
  - Logging out now returns to the Login screen and does not auto‑open the Two‑Factor screen.
  - If any known account has biometrics enabled, the login page will still offer “Login Using Biometrics”.
- Google avatar handling:
  - When a Google photo URL is present, the app prefers the highest‑quality variant and caches it locally when appropriate.
- Access tokens (JWT):
  - Backend now issues a short‑lived JWT on successful login (email/password, Google, TOTP verify, fingerprint complete).
  - Mobile stores the token in `SharedPreferences` (`accessToken`) and auto‑attaches `Authorization: Bearer <token>` to API calls.
  - Configure `JWT_SECRET` and `ACCESS_TOKEN_TTL_MINUTES` in `backend/.env`.

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

Example (`backend/services/auth-service/.env`):
```
GOOGLE_SERVER_CLIENT_ID=146767537658-ig1s62nfuddjj3j2r7it5nb9e207hv1q.apps.googleusercontent.com
GOOGLE_CLIENT_ID=146767537658-ig1s62nfuddjj3j2r7it5nb9e207hv1q.apps.googleusercontent.com
JWT_SECRET=your_jwt_secret_here
ACCESS_TOKEN_TTL_MINUTES=60
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
- Dependencies (pubspec):
  - `google_sign_in`, `flutter_dotenv`, `shared_preferences`, `local_auth`.
- Assets:
  - Ensure `.env` is listed under `assets:` in `pubspec.yaml`.
- `GoogleSignIn` setup (`mobile/app/lib/data/services/google_auth_service.dart`):
  - `serverClientId` from Web client ID.
  - `clientId` from `GOOGLE_ANDROID_CLIENT_ID` on Android.
- Login and Sign‑Up flows:
  - Login (`mobile/app/lib/presentation/screens/login_page.dart`) “Continue with Google”.
  - Sign‑Up (`mobile/app/lib/presentation/screens/signup_page.dart`) “Continue with Google”.
  - On Google sign‑in success, app calls backend and then checks MFA status.
  - If authenticator is enabled, navigates to the Two‑Factor screen.
  - If login was via biometrics, skips TOTP and proceeds to profile.
- Post‑Logout behavior:
  - After logout, users are redirected to the Login screen; Two‑Factor is not auto‑opened.
  - The login page still checks the backend for any biometric‑enabled account and shows biometrics if available.

## Backend Configuration
- Token verification (`backend/services/auth-service/src/routes/login.js`):
  - Verifies `idToken` with `audience: GOOGLE_SERVER_CLIENT_ID` when provided.
  - Extracts names from token payload when available.
  - Creates/updates user; returns profile JSON.
  - Adds `token` and `expiresAt` fields (JWT) in responses for:
    - `/api/auth/login/start`
    - `/api/auth/login/verify`
    - `/api/auth/login/google`
    - `/api/auth/login/verify-totp`
- MFA endpoints:
  - `POST /api/auth/login/verify-totp` to verify TOTP during login.
  - Location: `backend/services/auth-service/src/routes/login.js:635-780`
- JWT middleware:
  - `backend/services/auth-service/src/middleware/auth.js` provides `requireJwt` for protecting routes and `signAccessToken` for issuing tokens.
  - Set `JWT_SECRET` and optional `ACCESS_TOKEN_TTL_MINUTES` (default 60) in `auth-service/.env`.

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
 - Mobile persists `accessToken` and uses it on authenticated API calls (e.g., change password).

## Troubleshooting
- `ApiException: 10` on Android:
  - Android OAuth client does not match package + SHA‑1. Fix in Cloud Console.
- “Consent required”:
  - Add test users or publish the consent screen.
- `invalid_audience`:
  - Backend `.env` must use the Web client ID as audience.
 - `invalid_token` or `unauthorized`:
   - Ensure `JWT_SECRET` is set identically on the server, and the mobile app is sending `Authorization: Bearer <token>`.

## Security Notes
- Do not commit secrets. Keep client IDs in `.env` or secrets manager.
- Enable rate limiting in production and secure consent screen and domains.
