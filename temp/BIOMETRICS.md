# Biometrics Setup

## Overview
- Adds fingerprint-based login (via device biometrics) on mobile.
- Enforce single-account-per-device biometric rule with a clear error message.
- Validates biometric availability against the backend MFA status before use.

## Prerequisites
- Mobile:
  - Flutter `local_auth` plugin installed.
  - Android: device running Android with fingerprint support; ensure app’s `minSdkVersion` meets plugin requirements.
  - iOS: device running iOS with Touch ID/Face ID; add required Info.plist entries if using Face ID.
- Backend:
  - No special `.env` needed for biometrics beyond base URL and standard mail settings.
  - Rate limiting recommended in production.

## Key Concepts
- Fingerprint is treated as one MFA method. The backend tracks whether fingerprint is enabled (`fprintEnabled`) for a user.
- Device-level rule: Only one account per device may enable biometrics at a time. Attempts to enable for another account show a red error.
- Persisted keys on device:
  - `fingerprintEmail`: The email of the account that has biometric login enabled on this device.
  - `lastLoginEmail`: The last email used to log in (helps route biometric attempts).

## Mobile Behavior
- Visibility and auto-detection:
  - Login page checks `SharedPreferences` and backend `GET /api/auth/mfa/status` to decide whether to show “Login Using Biometrics”.
  - If biometrics are enabled and available on the device, the button is shown and can auto-trigger if requested.
- Enable flow:
  - From Security settings, user chooses fingerprint; app checks device support.
  - If another `fingerprintEmail` exists for a different account and is still enabled, a red error message is shown and setup is blocked.
  - When allowed, the app sends an OTP for fingerprint activation and verifies it to enable biometrics.
- Login flow:
  - App validates device biometrics and calls backend to start and complete the fingerprint login session.
  - On success, `fingerprintEmail` is updated to the logged-in account.
- Disable flow:
  - Disables biometrics for the account and clears `fingerprintEmail` if it matched the disabled account.

## Backend Endpoints
- `GET /api/auth/mfa/status` (requires JWT):
  - Returns MFA status and fingerprint enabled flag.
  - Location: `backend/services/auth-service/src/routes/mfa.js:172-208`
- `POST /api/auth/mfa/fingerprint/start` (requires JWT):
  - Sends an OTP to verify and enable fingerprint for the account.
  - Location: `backend/services/auth-service/src/routes/mfa.js:213-234`
- `POST /api/auth/mfa/fingerprint/verify` (requires JWT, body: `{ code }`):
  - Verifies the OTP and enables fingerprint MFA.
  - Location: `backend/services/auth-service/src/routes/mfa.js:236-291`
- `POST /api/auth/mfa/fingerprint/disable` (requires JWT):
  - Disables fingerprint MFA for the account.
  - Location: `backend/services/auth-service/src/routes/mfa.js:293-313`

## Code References
- Mobile detection and login button:
  - `mobile/app/lib/presentation/screens/login_page.dart` (biometrics gating and `_loginWithFingerprint`)
- Device-level restriction UI (red error):
  - `mobile/app/lib/presentation/screens/security/mfa_setup_screen.dart` (toggle and setup flow)
  - `mobile/app/lib/presentation/screens/security/mfa_settings_screen.dart` (settings actions)
- Mobile service calls:
  - `mobile/app/lib/data/services/mongodb_service.dart`
    - `getMfaStatusDetail`, `mfaFingerprintStart`, `mfaFingerprintVerify`, `disableFingerprintLogin`
    - `loginStartFingerprint`, `loginCompleteFingerprint`

## Troubleshooting
- Biometrics button not shown:
  - Ensure `fingerprintEmail` is set and backend shows `isFingerprintEnabled=true` for that email.
  - Confirm device has fingerprint support (`local_auth` check).
- Blocked on enabling for another account:
  - Clear or disable biometrics on the original account; the app will remove `fingerprintEmail` once backend reports it disabled.
- Fingerprint login fails:
  - Check that start returns a token and complete succeeds.
  - Verify backend connectivity and that the account truly has biometrics enabled.

## Security Notes
- Never store secrets in the repository.
- Keep OTP delivery and fingerprint login tokens short‑lived.
- Avoid logging sensitive user data (tokens, codes) in production logs.
