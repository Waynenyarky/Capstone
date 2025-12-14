# SSO: Continue with Google Setup

## Overview
- Implements “Continue with Google” on mobile and verifies Google users on the backend.
- Supports two modes:
  - With `idToken`: backend verifies token audience and extracts names and profile.
  - With only `email`: backend accepts the email when `idToken` is unavailable, then stores/updates profile.

## Prerequisites
- Google Cloud project with OAuth 2.0 client IDs.
- Mobile app package configured for Google Sign-In (`google_sign_in`).
- Backend running Node.js with `google-auth-library`.

## Backend Setup (.env)
- `GOOGLE_SERVER_CLIENT_ID`: Web client ID used for verifying ID tokens on the backend.
- `GOOGLE_CLIENT_ID`: Fallback client ID if `GOOGLE_SERVER_CLIENT_ID` is not set.
- Optional:
  - `DISABLE_RATE_LIMIT=true` to relax login rate limits in non‑production.

Example:
```
GOOGLE_SERVER_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
DISABLE_RATE_LIMIT=true
```

Notes:
- Create a “Web application” OAuth client in Google Cloud Console and copy its Client ID into `GOOGLE_SERVER_CLIENT_ID`.
- If you only set `GOOGLE_CLIENT_ID`, it will be used as the audience fallback.

## Mobile Setup (Android/iOS)
- Uses the `google_sign_in` plugin with `email` and `profile` scopes.
- On success, the app sends `idToken` (if available), `email`, `providerId`, and names derived from `displayName`.
- Android:
  - Ensure the applicationId (package name) matches the one registered in your Google Cloud OAuth credentials.
  - If you require server verification with `idToken`, also configure your app signing and OAuth consent screen.
- iOS:
  - Ensure the bundle identifier matches the one registered in your Google Cloud OAuth credentials.
  - Add required URL schemes if using advanced flows.

## Flow Summary
1. User taps “Continue with Google” in the login page.
2. Mobile obtains `idToken`, `email`, `providerId`, and `displayName`.
3. Mobile sends to backend:
   - `idToken` (or a fallback marker when unavailable),
   - `email`,
   - `providerId`,
   - `firstName`/`lastName` parsed from `displayName`.
4. Backend:
   - Verifies `idToken` if present (audience must match `GOOGLE_SERVER_CLIENT_ID`).
   - Extracts names from token (`given_name`, `family_name`), or splits `name`.
   - Falls back to app‑provided names, and if still missing, derives names from the email local part.
   - Creates or updates the user record and returns profile data.

## Troubleshooting
- `idToken` null:
  - The app will still pass `email`. Backend accepts email-only sign‑in.
  - If you require server verification, confirm your OAuth client ID and app signing configuration.
- Audience mismatch:
  - Ensure the token’s audience equals `GOOGLE_SERVER_CLIENT_ID` in `.env`.
- Names appear as “User”:
  - Re‑sign in with Google. Backend now updates names using token, `displayName`, or email local part.

## Security Notes
- Never commit secrets to the repository.
- Keep OAuth client IDs and any private keys in `.env` or your secret manager.
- Enable rate limiting in production and harden your OAuth consent screen.
